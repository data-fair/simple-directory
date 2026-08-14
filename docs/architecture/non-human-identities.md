# Non-human identities (NHI)

How simple-directory authenticates service accounts (AI agents, batch jobs,
k8s workloads) via external-JWT exchange, and how that exchange is confined
so it can never reach superadmin, cross-org, or the mail/password flows.
Required reading before changing the `nhi-token` exchange, `api/src/nhis/`,
or any NHI-related guard.

See also [`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md)
for the general site-isolation model this feature reuses.

## Why NHIs exist and how they're stored

Org admins can declare a non-human identity — an external system the org
trusts — that authenticates with a short-lived JWT issued by its own
provider (first target: Kubernetes projected service-account tokens) and
receives a normal simple-directory session scoped to that one organization.
There is no self-management and no email at any point of the lifecycle.

NHIs are **stored as `User` documents** (so they work everywhere a `User`
does: member listing, token payloads, avatars, webhooks) but **managed
exclusively through org-scoped endpoints** (`api/src/nhis/router.ts`,
mounted at `/api/organizations/:organizationId/nhis`). A single `nhi`
sub-object on the user record is the discriminator:

```
nhi: {
  provider: { issuer: string, jwks?: object },  // inline jwks, or OIDC discovery on issuer
  subject: string
}
```

`email` is optional on the base `User` schema to accommodate this (see
`api/doc/users/post-req/schema.js`); the human self-service signup endpoint
re-adds `email` to its own `required` list so this stays a no-op for humans.
Mongo storage only in v1 — LDAP/file storages do not create NHIs.

## Trust model

The pattern is a pragmatic subset of the OAuth 2.0 JWT bearer grant
(RFC 7523): trust an external issuer, verify its JWT against its JWKS, map
the bound subject to a local identity, exchange for a local session.

- **`(issuer, subject)` is fixed at creation**, explicitly, by an org admin
  (`createNhi` / `PATCH` in `api/src/nhis/service.ts` and
  `api/src/nhis/router.ts`) — never learned from a first-seen token. There is
  no bootstrap-on-first-use.
- **The issuer is bound per NHI**, not global: two NHIs in different orgs can
  trust different providers, and a token from the right issuer/subject pair
  for *another* NHI's binding does not verify against this one.
- **Audience = the URL of the site the exchange is called on**
  (`reqSiteUrl(req)`, passed as `audience` into `verifyAssertion`). This
  matches the `audience` field customers set on a Kubernetes projected
  service-account token.

`api/src/nhis/service.ts`:

```ts
export const verifyAssertion = async (assertion, provider, subject, audience) => {
  const keyResolver = await getKeyResolver(provider)
  const { payload } = await jwtVerify(assertion, keyResolver, {
    issuer: provider.issuer, audience, subject, requiredClaims: ['exp', 'sub', 'iat']
  })
  return payload
}
```

Signature, `iss`, `sub`, `aud`, and `exp`/`nbf` are all checked by `jose`'s
`jwtVerify` in one call — there's no partial-check window.

## The exchange endpoint: `POST /api/auth/nhi-token`

`api/src/auth/router.ts` (route starting at line 288). Body:
`{ client_id, assertion }`. `client_id` is the NHI's user id
(`nhi-<nanoid>`, prefixed for log legibility, opaque to services).

1. Gated behind `config.manageNhis` (default `false`) — a 404 when the
   feature isn't enabled for a deployment.
2. Rate-limited twice: once by caller IP, once by `client_id`, both through
   the shared auth limiter (`api/src/utils/limiter.ts`, Mongo-backed,
   `config.authRateLimit`). **The limiter consumes a point on every call,
   including a successful exchange** — there's no separate "only count
   failures" path. On a pod fleet sharing one egress IP, a legitimate burst
   of NHI logins can trip the per-IP bucket; operators running many NHIs
   behind one NAT gateway should size `authRateLimit` accordingly.
3. Every failure path — unknown `client_id`, non-NHI user, wrong site, bad
   assertion — returns the **same** `401 invalid credentials` through a
   single `reject()` helper that also sleeps a random 0–1000ms and logs
   `sd.auth.nhi.fail` with the real reason server-side. This avoids a status/
   body oracle on *which* check failed. (The 0–1000ms jitter bounds casual
   timing probing; it does not defeat a patient, high-precision attacker —
   see "known accepted surfaces" below.)
4. **Site scoping (project-owner decision).** The exchange only succeeds on
   the main site or on a site *owned by the NHI's own organization*:

   ```ts
   // api/src/auth/router.ts, /nhi-token route
   const userOrg = user.organizations[0]
   const site = await reqSite(req)
   if (site && !(site.owner.type === 'organization' && site.owner.id === userOrg.id &&
       (!userOrg.department || !site.owner.department || userOrg.department === site.owner.department))) {
     throw await reject('site not owned by nhi org ' + user.id)
   }
   ```

   The department comparison is deliberately department-tolerant — same
   shape as `getDefaultUserOrg` (`api/src/tokens/service.ts`): a
   department-less binding is accepted on any department site of the org,
   and vice versa, but two *different* non-empty departments never match.
   This means an org-owned secondary site cannot be used to mint a session
   for an NHI belonging to an unrelated org, and a compromised or
   misconfigured site config is confined to the org that actually owns it.
5. Key resolution and assertion verification (`getKeyResolver` /
   `verifyAssertion`, see SSRF section below).
6. **Session issuance is capped and non-refreshable by construction:**

   ```ts
   const exp = Math.min(assertionPayload.exp as number, nowSec + jwtDurations.nhiToken)
   const payload = getTokenPayload(user, site)
   const token = await setSessionCookies(req, res, reqSitePath(req), payload,
     'nhi-session', userOrg, { skipExchangeToken: true, exp })
   ```

   `jwtDurations.nhiToken` defaults to `30m` (`api/config/default.cjs`). The
   session lives at most `min(assertion exp, 30m from now)` — a long-lived
   assertion cannot buy a longer session, and a short-lived assertion caps it
   further. `skipExchangeToken: true` means `setSessionCookies` never sets
   `id_token_ex` (clearing any stale one from an earlier human session on the
   same browser instead) and no server session document is created. Session
   renewal (`keepalive`, `api/src/tokens/service.ts`) unconditionally 401s
   and logs the caller out when `id_token_ex` is absent — so there is no code
   path that could refresh an NHI session even by accident; it is
   structurally, not just policy, non-refreshable. The only way to get a new
   session is a new exchange with a fresh assertion.
7. The session is issued directly in the NHI's single org membership
   (`userOrg`, passed as the `getDefaultUserOrg`-equivalent argument to
   `setSessionCookies`) — there is no account choice at login and no
   switching afterwards (see "fail-closed audit" below).
8. The response body also returns `{ access_token, token_type: 'Bearer',
   expires_in }` for pure-HTTP callers that don't want to parse cookies.
   Because `setSessionCookies` still sets the browser cookies, and
   Playwright's `APIRequestContext` shares its cookie jar with the browser
   context, calling this endpoint from `context.request.post(...)` leaves
   the browser authenticated too — useful for e2e automation of NHI-driven
   flows.
9. `updateLogged` and `eventsLog.info('sd.auth.nhi.ok', …)` on success for
   observability; the HTML login form is untouched by any of this.

## Session payload

`getTokenPayload` (`api/src/tokens/service.ts`) adds `nhi: 1` (int-truthy,
consistent with the existing `ipa`/`os`/`idp` flags) when `user.nhi` is set,
and otherwise behaves like a normal payload: no `email` claim (the field is
`undefined` and dropped at JSON-signing time), the single org membership,
`ipa: 1` (personal account ignored). `isAdmin` is never set for an NHI — see
the invariant below. Downstream services are expected to read the `nhi` flag
to suppress mail-based actions and account-switching UI; this needs a
companion change upstream (see "out of scope" below).

## Superadmin exclusion (defense in depth, not just "no email")

An NHI has no email, which already makes `config.admins` matching
structurally unreachable. The exclusion is still enforced affirmatively at
every layer, because relying solely on "no email" would break the moment
someone adds an email-independent admin path later:

- **`cleanUser` force** (`api/src/storages/mongo.ts`):
  ```ts
  resource.isAdmin = !resource.host && (config.admins.includes(resource.email?.toLowerCase()) || resource.id === '_superadmin')
  if (resource.nhi) resource.isAdmin = false
  ```
  This runs after the normal `isAdmin` computation, so it wins regardless of
  what the email/host logic produced.
- **`getTokenPayload` guard** (`api/src/tokens/service.ts`): the `isAdmin`
  assignment is gated on `!user.nhi` up front, covering both the plain
  `config.admins` branch and the `config.adminModeOnSites` branch (itself
  email-based and thus already unreachable for an NHI — the guard is
  redundant-on-purpose defense in depth, matching the layering style used
  for site isolation).
- **`asAdmin` impersonation target refusal** (`api/src/auth/router.ts`,
  `POST /asadmin`): `if (user.nhi) throw httpError(403, ...)` — an NHI can
  never be impersonated, on top of never being able to *initiate* an
  adminMode session itself (no `isAdmin` ⇒ no adminMode offer).

## Fail-closed audit of user-facing flows

Most flows are unreachable for an NHI purely because it has no email and no
password — this is structural, not enforced by a check:

- **Password login** — unreachable (no password set, no email to match).
- **Mail-action tokens, password reset, passwordless login** — the mail step
  that would deliver a token has nowhere to send it.
- **Invitations** — NHI creation is direct (`createNhi`), never invitation-
  based; there is no invitation code path that touches an NHI record.
- **`keepalive` (session refresh)** — dead by construction, see above.

Where a flow *is* reachable by an authenticated NHI session (it holds valid
cookies, so it can call any endpoint an authenticated human could), it is
explicitly rejected via `assertNotNhiSession(req)`
(`api/src/nhis/service.ts`, throws `403 forbidden for non-human identities`
when `reqSession(req).user.nhi` is truthy). As implemented, the guard sits
on:

- `POST /api/users` (self-service user creation) —
  `api/src/users/router.ts:69`
- `PATCH /api/users/:userId` (self-edit) — `api/src/users/router.ts:263`
- `DELETE /api/users/:userId/plannedDeletion` (cancel planned deletion) —
  `api/src/users/router.ts:313`
- `DELETE /api/users/:userId` (self-delete) — `api/src/users/router.ts:331`
- `POST /api/invitations` — `api/src/invitations/router.ts:23`
- `POST /api/organizations` (org creation) —
  `api/src/organizations/router.ts:128`
- `PATCH /api/organizations/:organizationId/members/:userId` (role change) —
  `api/src/organizations/router.ts:333`
- `POST /api/2fa` (2FA enrollment) — `api/src/2fa/router.ts:18`

**Members PATCH also has a structural 404 gate** independent of the guard
above: it resolves the target member through `storage.findMembers(...)`,
which defaults its new `types` filter to human users only
(`api/src/storages/mongo.ts`: `if (!types.includes('nhi')) filter.nhi = {
$exists: false }`). An NHI id passed as `:userId` 404s before the
`assertNotNhiSession` guard is even relevant — the guard covers the case of
an NHI *session* acting on someone else, the 404 gate covers an NHI as
*target*. `GET /api/organizations/:id/members` uses the same default, so
existing consumers (quota counts, invitation UIs, other services) see no
behavior change unless they opt in with `?types=nhi` or
`?types=user,nhi`.

**Cleanup jobs exclude NHIs.** `storage.findInactiveUsers` /
`findUsersToDelete` (`api/src/storages/mongo.ts`) filter NHIs out, so
`api/src/users/worker.ts`'s planned-deletion and hard-delete cron never
touches one — lifecycle stays an explicit org-admin action (`DELETE
/api/organizations/:id/nhis/:nhiId`), and the worker code can assume
`user.email` is defined without an extra null check (see the comment at
`api/src/users/worker.ts:23`).

## SSRF posture of issuer discovery

`api/src/nhis/keys.ts`. Discovery (used when an NHI binding has no inline
`jwks`) fetches `<issuer>/.well-known/openid-configuration` and then the
`jwks_uri` it returns, both through `assertSafeIssuer`:

- **https-only.** Plain `http://` issuers are rejected outright (dev/test
  escape hatch below).
- **Private/loopback/link-local hosts blocked** via a `node:net` `BlockList`
  populated with the standard non-routable IPv4 ranges (loopback, RFC1918,
  link-local, CGN `100.64.0.0/10`) and IPv6 ranges (`::1`, ULA `fc00::/7`,
  link-local `fe80::/10`), plus an explicit `localhost`/`*.localhost`
  string check that isn't an IP literal at all.
- **IPv4-mapped IPv6 handled without manual extraction** — `BlockList`
  natively understands `::ffff:127.0.0.1` (and its canonical hex form
  `::ffff:7f00:1`) against the IPv4 subnets, per the comment in
  `keys.ts`.
- **Alternate IPv4 encodings are covered for free**: WHATWG `URL` parsing
  (used to obtain `url.hostname`) canonicalizes hex/octal/decimal IPv4
  forms (e.g. `0x7f.0.0.1`) into dotted-decimal before `assertSafeIssuer`
  ever inspects the hostname, so no bespoke decoder is needed — this is
  asserted directly by a unit test (`tests/features/nhi-assertion.unit.spec.ts`,
  "alternate ipv4 encoding is rejected").
- **Known low-severity residual**: the deprecated IPv4-compatible IPv6 form
  (`::a.b.c.d`, distinct from the IPv4-*mapped* form above) is not covered
  by the `BlockList` subnets or the canonicalization step. It's obsolete
  (deprecated by RFC 4291 / RFC 5156) and essentially unsupported by modern
  resolvers and HTTP clients, so the practical exposure is low; it is
  documented rather than fixed pending real-world evidence it's reachable
  through Node's actual DNS/socket stack for this code path.
- **`config.nhisAllowInsecureIssuers`** (default `false`) bypasses both the
  https and private-host checks entirely — for dev/test only, where issuers
  are commonly `http://localhost:...` mock OIDC servers. It must never be
  enabled in a production config; nothing in the code enforces that beyond
  the default and operator discipline, consistent with other dev-only
  escape hatches in this codebase (e.g. `ENABLE_TEST_API`).
- **Inline JWKS is the private-cluster answer.** An NHI binding can carry
  `nhi.provider.jwks` directly; when present, `getKeyResolver` returns a
  `createLocalJWKSet` and skips discovery/SSRF-checking entirely — this is
  the documented path for issuers on a private network the SD server can't
  (and shouldn't) reach.
- **Discovery result caching, ~10 minutes.** `getJwksUri` is memoized with
  `maxAge: 10 * 60 * 1000`. Key rotation on the issuer side (new `kid`) is
  picked up automatically without waiting out that cache: `jose`'s
  `createRemoteJWKSet` (used for the resolved `jwks_uri`, cached separately
  per URI in `remoteJwks`) refetches the JWKS itself when it sees an unknown
  `kid`, subject to its own internal cooldown. The 10-minute cache is only
  on the discovery *document* → `jwks_uri` mapping, which changes far less
  often than keys. **Inline JWKS rotation is a manual admin task** — there is
  no refetch mechanism for a `jwks` object stored directly on the user
  record; rotating those keys means an org admin `PATCH`-ing the binding.

## Partial unique index on `email`

`api/src/mongo.ts` — the `email_1` index on `users` is declared with
`partialFilterExpression: { email: { $exists: true } }`:

```ts
{ unique: true, collation, name: 'email_1', partialFilterExpression: { email: { $exists: true } } }
```

A plain `sparse` index would not have been sufficient here: sparse only
excludes documents missing *every* indexed field, but the compound index
also covers `host`, and NHI/some LDAP-backed records can have `host` set (or
not) while lacking `email` — so two email-less documents could still collide
on a `(null, null)` slot under `sparse` alone. The partial filter instead
excludes any document without an `email` field from the uniqueness
constraint outright, so arbitrarily many NHIs (and any other email-less
user) can coexist.

Operationally: `@data-fair/lib-node`'s `mongo.configure` drops and recreates
indexes by name when their definition changes, so upgrading to this index
shape causes a brief rebuild window on the `users` collection on first
deploy of this feature. Expected and one-time, not a recurring cost.

## Known accepted low-severity surfaces

Documented rather than fixed — each is either inherent to the design or a
narrow, low-value target:

- **An NHI can revoke its own session record**: `DELETE
  /api/users/:userId/sessions/:sessionId` has no `assertNotNhiSession` guard.
  Impact is self-limited to the NHI's own session bookkeeping.
- **An NHI can set its own avatar**: the avatar endpoints have no NHI guard
  either. Cosmetic only.
- **Timing side-channel on `client_id` existence beyond the jitter**: the
  0–1000ms random delay in the `/nhi-token` `reject()` path bounds casual
  probing but is not a constant-time guarantee; a patient, high-precision
  attacker could in principle attempt statistical timing analysis. Given
  `client_id` is a `nhi-<nanoid>` (not a guessable value in the first
  place), this is judged impractical to exploit for enumeration.
- **No replay protection on the assertion** beyond its own `exp`/`nbf`: this
  is inherent to RFC 7523 bearer-assertion exchange (there's no server-side
  nonce/jti tracking). A captured, still-valid assertion can be replayed
  until it expires (assertion `exp`, further capped by `nhiToken`, so at
  most 30 minutes of exposure by default). Standard bearer-token trust
  model, not a defect specific to this feature.
- **Rate limiter consumes a point on successful exchange**, see the
  exchange-endpoint section above — operationally relevant for pod fleets
  sharing an egress IP.

## Out of scope / follow-ups

- Companion PR to `@data-fair/lib-express`: add `nhi?: 1` to
  `SessionState['user']` and make `email` optional there, to remove the
  `as any` casts currently in `api/src/tokens/service.ts` and
  `api/src/nhis/service.ts`.
- Downstream services (data-fair, portals, …) need to honor the `nhi: 1`
  claim to hide mail-based actions and account switching in their own UIs.
- Discovery-path integration testing against a real OIDC mock — the unit
  tests cover inline JWKS and the SSRF guard directly; discovery itself is
  exercised in dev/staging, not CI.
- LDAP/file storages, cross-org or personal NHIs, and a full OAuth token
  endpoint (`grant_type`, standard OAuth error codes) are all explicitly out
  of scope for v1.

## Invariants

1. `(issuer, subject)` for an NHI is set only by an org admin at creation
   time, never inferred from an incoming token.
2. `/api/auth/nhi-token` only issues a session on the main site or a site
   owned by the NHI's own organization (department-tolerant comparison).
3. An NHI session's `exp` never exceeds `min(assertion.exp, now +
   config.jwtDurations.nhiToken)`, and the session is non-refreshable by
   construction (`skipExchangeToken`, no server session, `keepalive`
   structurally fails without `id_token_ex`).
4. `user.nhi` implies `isAdmin` is never set, at both the storage layer
   (`cleanUser`) and the token layer (`getTokenPayload`), and an NHI record
   can never be an `asAdmin` impersonation target.
5. An NHI session is rejected on every user-mutation and auth-action
   endpoint that isn't the exchange itself or its own session-list/avatar
   (`assertNotNhiSession`), and cleanup cron jobs never touch NHI records.
6. Issuer discovery is https-only and blocks private/loopback/link-local
   hosts unless `config.nhisAllowInsecureIssuers` is explicitly set (dev/
   test only); inline JWKS bypasses discovery entirely for private
   clusters.

Violations of #2 or #4 would let a compromised site config or an NHI's own
session escalate beyond its owning org — the same category of failure this
document's sibling, `email-trust-and-site-isolation.md`, guards against for
human SSO.
