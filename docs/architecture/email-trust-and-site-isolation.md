# Email trust and site-level isolation

How simple-directory decides whether to trust an IdP's email claim, and how
that trust is confined to a single *site*. Required reading before changing
auth providers, `cleanUser`, `authProviderLoginCallback`, `adminMode`, or the
change-host flow.

See also [`../core-id-providers.md`](../core-id-providers.md) for the
orthogonal `coreIdProvider` model (provider-as-authoritative-identity).

## Why email is high-value

`user.email` drives admin rights (`config.admins`), account linking on SSO
(`getUserByEmail`), invitations, and org membership. An IdP that can make SD
accept an arbitrary email string can impersonate the corresponding user — up
to superadmin if the email is in `config.admins`.

## Sites as trust boundaries

A site is `(host, path)` with its own config, auth providers, and user scope.

- **Main site** — operator-managed, trusted by all sites.
- **Secondary site** — site-admin-editable, trusts only itself.

### User scoping

User records carry an optional `host`. `getUserByEmail(email, site)` only
matches the right scope, so a secondary-site SSO cannot resolve to a main-site
record by email collision.

### Admin rights require a main-site record

```js
isAdmin = !resource.host
  && (config.admins.includes(resource.email?.toLowerCase())
      || resource.id === '_superadmin')
```

A record tied to any secondary site can never be `isAdmin` — this is the core
guarantee preventing cross-site admin takeover. This storage-level rule is left
intact; the `config.adminModeOnSites` opt-in (default `false`) does **not**
touch it. Instead, when enabled, `getTokenPayload` grants the **session** an
`isAdmin` claim for a configured superadmin (`config.admins` / `_superadmin`)
on a site, so a single superadmin can administer several operator-trusted sites
(e.g. dev/qualif/prod) while internal storage-level admin checks stay confined.
It must not be enabled when any site is not operator-trusted.

Org membership is not site-scoped, but memberships attach to user records, so
a compromised site A cannot inherit memberships from another site.

## Email verification

Per-provider, reject on an explicit negative signal. Providers that omit a
verification claim are accepted because enterprise directory-backed IdPs
(Azure AD / Entra ID, ADFS, corporate Keycloak fronting LDAP/AD) routinely
omit it while treating the directory-provisioned email as verified. A strict
opt-in check would break those integrations for a narrow residual win,
because the structural defenses below already contain the impact of a
looser IdP.

- **OIDC** (`api/src/oauth/oidc.ts`) — rejects only when
  `claims.email_verified === false`. Absent / null / non-boolean passes.
  Per-provider `ignoreEmailVerified: true` escape hatch, gated behind
  superadmin-level site-config editing, suppresses even the explicit-false
  rejection.
- **Google** — requires `verified_email === true` on the v1 userinfo
  (Google always emits this reliably, so strict opt-in is correct here).
- **GitHub** — requires the address to be both `primary` and `verified`.
- **Facebook** — refused (no verification flag exposed).
- **LinkedIn** — primary email is considered verified upstream.
- **SAML 2** — no standard verified flag; adding a SAML IdP is an explicit
  trust statement. Site-level IdPs remain confined by user scoping.
  `api/src/saml2/service.ts` installs `@authenio/samlify-node-xmllint` as the
  samlify schema validator, which is required to mitigate XML
  signature-wrapping attacks. The SP also advertises
  `wantAssertionsSigned: true` in its metadata, and the
  `config.saml2.sp` operator-config spread cannot override SP cert material,
  `entityID`, `assertionConsumerService`, or the wantAssertionsSigned flag
  (the spread is applied first, the trusted fields last).

### Why OIDC is looser than the OAuth providers

The spec (OIDC Core §5.1) makes `email_verified` OPTIONAL for providers to
emit. In practice the population of providers that omit it is dominated by
enterprise directory-backed IdPs where the email is admin-provisioned and
implicitly verified, not self-asserted. The population that emits
`false` is dominated by self-registration IdPs before confirmation — those
we still reject. The thin slice in between (buggy provider that should
emit `false` but omits) is left to the structural defenses.

### Monitoring

Rejections emit `eventsLog.alert` entries to monitor post-deployment:

- `sd.oidc.email-not-verified` — provider, raw `email_verified` value, domain.
  Fires only on explicit `false`; fix upstream, or set
  `ignoreEmailVerified: true` on the provider (superadmin-level decision).
- `sd.oauth.email-not-verified` — provider, reason / claim value.

Implementation: `userInfo(accessToken, idToken?, logContext?)` takes an
optional log context; call sites with a request pass it, background paths
(e.g. token-refresh worker) omit it.

## Preventing SSO superadmin escalation

A main-site IdP is structurally capable of asserting an admin email. Defenses:

- **Standard OAuth providers cannot authenticate superadmins** —
  `authProviderLoginCallback` refuses when `provider.type === 'oauth'` and
  the matched user is admin. These providers (github / google / facebook /
  linkedin, from `config.oauth.providers`) are user-registration IdPs:
  anyone can create an account under an arbitrary email, so a collision
  with `config.admins` cannot be trusted as identity proof.
- **Root-level OIDC / SAML providers may authenticate superadmins.**
  Configured in `config.oidc.providers` / `config.saml2.providers` — these
  are operator-declared IdPs (corporate directory, SSO broker) where the
  email binding is trusted by deployment decision. Needed for on-premise
  deployments where the superadmin logs in via the company SSO.
- **Site-level providers are structurally incapable** of producing a
  superadmin session: user records on a secondary site carry `host`, and
  `isAdmin` requires `!host`.
- **`adminMode` is main-site only** — password and SSO login paths both
  refuse `adminMode=1` on any non-main-site session (redundant with the
  `!host` guard, kept as defense in depth). **Opt-out:** `config.adminModeOnSites`
  (env `ADMIN_MODE_ON_SITES`, default `false`) lets a configured superadmin
  (`config.admins` / `_superadmin`) obtain a session `isAdmin` claim — and thus
  `adminMode` — on a secondary-site session. It is implemented at a single
  chokepoint, `getTokenPayload` (so every token path stays consistent), and
  leaves the storage `isAdmin = !host` rule untouched. This relaxes invariant #2
  and re-opens cross-site admin escalation through any non-operator-trusted
  site, so it must only be enabled when every site belongs to the same trusted
  operator (e.g. dev/qualif/prod of a single tenant).

## adminMode session hardening

Entering `adminMode` is a re-authentication, not just a flag flip. Three
controls bound the privilege once granted (see the password route in
`api/src/auth/router.ts`, `setSessionCookies`/`keepalive` in
`api/src/tokens/service.ts`, and `api/src/oauth/service.ts` /
`api/src/saml2/service.ts` for the SSO side):

- **Fresh second factor every time.** When 2FA is configured (active, or
  required via `storage.required2FA`), a password login carrying `adminMode`
  ignores the long-lived `id_token_2fa_<userId>` cookie and demands a fresh
  TOTP. Normal logins still accept that cookie; only the adminMode path
  forces re-entry, so a stolen/forgotten 2FA cookie cannot be replayed into a
  superadmin session.
- **Hard time cap.** adminMode sessions sign their exchange token
  (`id_token_ex`) with `jwtDurations.adminExchangeToken` (default `12h`)
  instead of the rolling `exchangeToken` (30d), and `keepalive` preserves the
  *original* `exp` rather than extending it. When it lapses, `keepalive`
  fails and the user is logged out and must fully re-authenticate. Dropping
  adminMode (`DELETE /adminmode`) returns the session to the normal 30d
  policy; `asAdmin` impersonation inherits the same 12h cap.

  Two boundaries on the word "hard": (a) the last-issued 15m `id_token` is
  still accepted on protected routes until its own `exp`, so effective access
  ends up to ~15m past the cap; (b) the cap is **per server session**, not per
  identity — `POST /auth/site_redirect` propagates adminMode into a *new*
  server session via `token_callback`, which mints a fresh 12h window without
  re-auth. Closing that path was considered and deliberately deferred (it
  would change cross-site admin UX); the 12h cap is therefore a per-session
  ceiling, and a determined holder of a live adminMode session on a
  multi-site deployment can refresh it by redirecting. The cap's value is
  bounding an *idle/forgotten* adminMode session, which it does.
- **Fresh IdP authentication for SSO adminMode.** SSO adminMode trusts the
  IdP's own MFA by deployment decision (root-level OIDC/SAML are
  operator-declared). To stop a silent IdP-session reuse, adminMode logins
  force a fresh authentication at the IdP: `prompt=login` for OIDC,
  `ForceAuthn="true"` in the SAML AuthnRequest. SD does not verify
  `auth_time`/that the IdP honored the request — this is a trust statement
  about operator-declared IdPs, not an enforced check.

The in-login `offerAdminMode` flag (sent by the SD login page on a normal
superadmin login) makes `POST /auth/password` return the JSON object
`{ step: 'adminMode' }` instead of the usual callback-URL string, creating no
auth session; the UI then offers the switch, and accepting re-POSTs with
`adminMode=1` through the full fresh-TOTP path. Callers of `/auth/password`
must tolerate this object-vs-string response shape (only the SD login page
sends the flag; form-mode/data-fair callers never do).

## Change-host hardening

Password login into a secondary site with a main-site account offers a host
transfer. Sensitive: after the transfer, the record carries `host` and loses
admin status permanently. Two safeguards:

- Users in `config.admins` cannot be transferred (prevents phishing-driven
  superadmin lockout).
- Target `(host, path)` is signed into the action token; the `/host` endpoint
  applies the host from the decoded token, not the request body.

## Invariants

1. A secondary-site user **record** never carries admin status (storage rule,
   unchanged).
2. `adminMode=1` (and the session `isAdmin` claim) is only ever set on a
   main-site session, unless `config.adminModeOnSites` is explicitly enabled —
   in which case `getTokenPayload` grants it to a configured superadmin on a
   site too.
3. A standard OAuth provider (`provider.type === 'oauth'`) never produces a
   superadmin session. Root-level OIDC / SAML providers may, by deployment
   decision.
4. No SSO provider accepts an unverified email; the per-provider opt-out
   (OIDC only) requires a superadmin-level config edit.
5. A `changeHost` token's effect is bounded to the `(host, path)` it signs.
6. A password-based `adminMode` login never reuses a remembered 2FA
   validation, and an `adminMode` server session expires at most
   `jwtDurations.adminExchangeToken` (default 12h, +~15m id_token grace)
   after it was granted — modulo a fresh grant through a new login or a
   `site_redirect` (per-session, not per-identity).

Violations re-open an exploit path in the C-0 family from
`docs/security-review-2026-04.md`.
