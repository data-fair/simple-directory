# OAuth authorization server

How simple-directory issues OAuth 2.0 access tokens at `/api/oauth/token`,
which site is the issuer of those tokens, which resources a token can target,
and the invariants that keep the server from becoming a way around the NHI
confinement or the session protections. Two parts:

- M1, the machine grants for non-human identities (NHIs): always available
  when `oauthServer.enabled` and `manageNhis` are on.
- M2, the authorization code flow with PKCE, SD-owned consent screens, rotating
  refresh tokens and revocable grants, for site clients (dashboards, user
  subject) and dynamic clients (MCP agents, always bound to an NHI chosen by an
  org admin). Site clients need `oauthServer.siteClients`, dynamic clients
  `oauthServer.agentClients`; the flow is served when either is on.

Required reading for changes under `api/src/oauth-server/`, the token
endpoint, the consent screens or discovery.

See also [`non-human-identities.md`](non-human-identities.md) (the NHI model
and the assertion exchange this endpoint reuses) and
[`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md)
(site isolation). `api/src/oauth/` is the unrelated SD-as-client code for
external identity providers; the server lives in `api/src/oauth-server/`.

## Shape

`oidc-provider` (node-oidc-provider) does the protocol work (discovery,
`client_credentials`, private_key_jwt client authentication, resource
indicators). SD wraps it:

- `router.ts` is a dispatcher mounted on `/api/oauth/*` and the two
  `/.well-known/{openid-configuration,oauth-authorization-server}` documents.
  It forwards only an allowlist of exact canonical routes (see
  [Routes](#routes)); every other path under
  `/api/oauth/` or variant spelling of a discovery document is 404. The
  provider's own router is case insensitive and accepts trailing slashes, so
  without the allowlist `/api/oauth/Token/` would reach the token endpoint
  past the rate limiter and the failure log. The provider's own jwks route is
  not forwarded: discovery advertises the scoped key set instead. The
  dispatcher then resolves the issuer from the request site, answers the JWT
  bearer grant itself, and hands everything else to the provider of that
  issuer.
- `providers.ts` caches one provider per issuer, rebuilt when the scoped
  signing key rotates or the issuer context (site, site `updatedAt`) changes,
  because the provider's hooks read the context through closures.
- `configuration.ts` holds the provider configuration, the resource hook and
  the discovery overrides; `access-token.ts` the claims; `issuers.ts` the
  issuer and resource rules; `clients.ts` the client lookup; `adapter.ts` the
  mongo storage of provider models.
- M2 adds `interaction.ts` (the Express routes of the login handoff and the
  consent), `consent.ts` (who may consent, which accounts a grant can be bound
  to, creation of the provider `Grant`), `grants.ts` (the SD grant records and
  their revocation), `grant-subject.ts` (the re-check at every issuance),
  `grants-router.ts` (connected applications of a user) and
  `dynamic-clients.ts` (CIMD, DCR, SSRF safe fetch).
- Tokens are signed with the **scoped** key set (the one behind
  `/.well-known/scoped-jwks.json`), never with the session keys.

## Issuer sites and realm

The issuer of a request is derived from its site (`issuerOfSite`):

| Request site | Issuer |
| --- | --- |
| main site | `config.publicUrl` |
| an account main site (`isAccountMain`), or a standalone `onlyLocal` site whose owner has no designated main site | `<site url>/simple-directory` |
| anything else | no issuer: 404 |

The site URL of the request must also be the canonical URL of the site that
was resolved for it (same host, path equal to the site path), and the main
issuer is only reached through the main site URL. The site lookup is a host
plus path prefix match, so a request on a path site can resolve to the root
site of the same host (or an unknown host to the main site); without this
guard, the default audience (the request site URL) would name a site of
another realm. Such a request has no issuer: 404.

An issuer site must additionally be **its own account main site**
(`resolveAccountMainSite(site)._id === site._id`). A site flagged
`isAccountMain` but left in `onlyBackOffice` resolves to another site, so it is
not an issuer: a site cannot declare itself an issuer by flag alone.

The **realm** of an issuer is the set of sites whose account main site is that
issuer (the main site for the main issuer). A token issued by an issuer can
only target resources inside its realm, so one issuer never vouches for users
or NHIs of another realm.

## Machine grants

Both grants are for NHIs only and exist only when `manageNhis` is on. The
`client_id` is the NHI user id.

**JWT bearer (RFC 7523 §2.1)** -- `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`,
`client_id`, `assertion`, optional `scope` and `resource`. Works for every NHI
whatever its key binding (inline `jwks` or issuer discovery). It runs the
exchange of `/api/auth/nhi-token` (`api/src/nhis/exchange.ts`: rate limit,
site ownership, `allowedIps`, assertion verification, `exp` cap) without
cookies.

**`client_credentials` with `private_key_jwt`** -- the NHI authenticates with a
client assertion signed by its own key. The provider authenticates the client
against the NHI's inline `jwks`, so only NHIs whose key binding has inline
`jwks` are clients (`findNhiClient`, synthesized from the NHI record on every
lookup, never stored). NHIs relying on issuer discovery use the JWT bearer
grant only. The provider rejects a replayed client assertion.

### Why the JWT bearer grant bypasses the provider

SD answers the JWT bearer grant ahead of the provider, on the same endpoint.
A provider client has exactly one token endpoint authentication method. A
Kubernetes projected service account token is a JWT bearer *assertion* issued
by the cluster, it cannot be a `private_key_jwt` client assertion (its `iss`,
`sub` and `aud` are not the client's), so it cannot authenticate through the
provider. Handling the grant in `jwt-bearer.ts` also keeps the credential
checks, the uniform failure and the rate limiting of the NHI exchange in one
place (`exchange.ts`, shared with `/nhi-token`).

## Resources and audiences

A `resource` (RFC 8707) names where the token will be used. `resolveResource`
parses it strictly: scheme equal to the site's, no query, fragment or
userinfo, no `//` in the path; it is reduced to its canonical origin plus
pathname without trailing slash. Without `resource` the target is the issuer
site itself.

- **API resource** -- the URL of a site in the realm. Token `aud` is that site
  URL, which is what the lib audience check compares with the request site.
- **MCP resource** -- a URL containing `config.mcpPath` (default `/mcp-server`)
  followed by `/`: the part before it is the site, the full path is the MCP
  server. Token `aud` is **two audiences**, `[<site url><mcpPath>, <site url>]`:
  the MCP server itself and the site API it fronts.
- An unknown resource or one outside the realm is `invalid_target`.
- For an NHI, the target site must be the main site or a site owned by the
  NHI's organization (`assertNhiMayTarget`, same department-tolerant rule as
  `/nhi-token`).

## Claims

The access token is an RFC 9068 `at+jwt` (30 minutes at most, `jwtDurations.nhiToken`,
and never past the assertion `exp`):

- `iss` the issuer, `sub` and `client_id` the NHI id, `aud` as above, `jti`,
  `iat`, `exp`;
- `scope`: the NHI's granted scope. OIDC identity scopes (`openid`, `profile`,
  `email`, `offline_access`) are dropped, a machine grant has no end user;
- the SD token payload of the NHI for the target site (`getTokenPayload`:
  `organizations`, `name`, ...), minus every admin claim;
- `boundIp` when the NHI has `ipBinding`.

The claims are computed by the grant that knows the NHI and handed to the
provider's JWT customizer through the koa state, so both grants produce the
same token shape. The code and refresh grants of M2 use the same path: the
claims are rebuilt from the grant record and the current user or NHI at every
issuance, with `sub` and `client_id` the user or NHI, `scope` the narrowed
platform scope, `organizations` the bound account only and 15 minutes for a
user subject. A user subject never gets the MCP audience, and no token carries
`isAdmin`, `adminMode` or `asAdmin`. An ID token (user subjects, with `openid`)
carries `sub`, plus `name` for `profile` and `email` for `email`.

## Authorization code flow (M2)

### Client families

A client id is classified by its shape and nothing else (`clientKind`). The
adapter's `Client.find` runs the chain NHI client, site client, stored DCR
client; the provider's own CIMD fetch comes last.

| Kind | Client id | Subject of its grants | Authentication | Resources |
| --- | --- | --- | --- | --- |
| NHI | `nhi-<nanoid>` | the NHI (`client_credentials` only, M1) | `private_key_jwt` | realm, per NHI |
| site client | `site-<nanoid>` | a **user** | none (public, PKCE) | the client's registered `resources`, default the issuer site; never an MCP server |
| CIMD | the https URL of the document | an **NHI** | none or `private_key_jwt` | any resource of the realm, including MCP |
| DCR | `dcr-<nanoid>` | an **NHI** | none or `private_key_jwt` | same as CIMD |

A site client's grant never has an NHI subject, a dynamic client's grant never
has a user subject; `createConsentGrant` refuses the other pairs and
`checkGrantSubject` refuses them again at every issuance.

**Site clients** are entries of the `oauthClients` list of an issuer site
document, edited by superadmins only (site PATCH requires admin mode). The id
is generated on first save and never changes or moves between sites. A client
has a name, optional `https` logo, redirect URIs, `allowedOrigins`, `scopes`,
`resources` and a `consent` mode. On save: redirect URIs must be `https` (or
`http` on a loopback host) without fragment or credentials; `allowedOrigins`
bare origins of the same kinds (they default to the origins of the redirect
URIs) and are the CORS origins of the token and revocation endpoints, a
privilege reserved to site clients (`sd_allowed_origins` is rejected on any
other kind); `scopes` are checked against the known scopes. With its token, a
dashboard calls the APIs from the browser. Every scope-aware service, SD
included, answers those calls from any origin, without credentials, when they
carry a bearer token: lib-express `session.bearerCors()`, mounted in
`api/src/app.ts` after the authorization server. A bearer token is not ambient,
so the origin adds nothing to it, and a call without one gets no CORS header.
`/api/oauth/*` is answered before it, with the per-client rule above.
Data-fair answers CORS on every route with `*` and no credentials. Removing a client
from the list, or deleting the site, revokes all its grants. The main site's
clients are read from its document only when `MAIN_SITE_FROM_DB` contains
`oauthClients`.

**Dynamic clients** are for agents (MCP clients) that nobody registered by
hand. Registration (`POST /api/oauth/register`) is open (no initial access
token, no registration access token, no management route: a registration is
final) and CIMD (a client whose id is an https URL serving its metadata) needs
no registration at all. Both go through `normalizeDynamicMetadata`:

- token endpoint authentication `none` (default) or `private_key_jwt`; grant
  types `authorization_code` and `refresh_token` only; response type `code`
  only. `client_credentials` is not available to a dynamic client;
- `sd_*` metadata and `sector_identifier_uri` are stripped; `logo_uri`,
  `client_uri`, `policy_uri`, `tos_uri` and `jwks_uri` must be `https`;
- `application_type: native` is set when every redirect URI is loopback or
  every one is a private-use scheme; otherwise (`https`, or loopback with
  `https`) the client is web. The provider ignores the port of a loopback
  redirect URI (RFC 8252 7.3) only for native clients, so the port relaxation
  applies only when **every** redirect URI is loopback. Loopback together with
  `https` makes a web client (exact match, port included); loopback together
  with a private-use scheme is refused;
- a CIMD document is fetched by the provider through `ssrfFetch` (lib-node
  SSRF rules, IP literals checked, no redirect followed, 2.5 s, 5 KB), the
  result is normalized by the same function and `allowClient` re-checks it on
  every use. A test-only fixture hook serves documents from memory and exists
  only with `ENABLE_TEST_API=1`;
- a DCR client is stored per issuer with a `dcr-` id. Stored clients older than
  30 days with no live grant record are deleted by the users worker (there is
  no `lastGrantAt`, a client with a grant is kept).

An unverified dynamic client is never given a logo on the consent screen: its
self-declared name, its id URL (CIMD) or the fact that it registered itself
(DCR), and the host the code goes to. Against display spoofing, the name is
stripped of control characters, bidi controls (U+202A-U+202E, U+2066-U+2069,
U+200E, U+200F, U+061C) and zero-width characters (U+200B-U+200D, U+2060,
U+FEFF) and truncated (`logSafeName`), and the id URL and the redirect host are
shown in their WHATWG serialization, so an internationalized host appears
punycoded (`xn--...`).

### Redirect URIs

Redirect URIs are matched exactly by the provider: no prefix, no wildcard, no
normalization (trailing slash, path case, extra query and another port are all
refused). The one exception is the port of a loopback `http` URI for a dynamic
client whose redirect URIs are all loopback (above). A site client never gets
the loopback port rule.

| Kind | Allowed redirect URIs |
| --- | --- |
| site client | `https`; `http` on `localhost`, `127.0.0.1`, `[::1]` |
| dynamic client | `https` (not a loopback host); loopback `http`; private-use schemes with a dot (reverse domain name, RFC 8252 7.1). `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`, `about:` and anything with a fragment or credentials are refused |

### The login handoff and the consent

The provider keeps no login state of its own: SD's cookie session is the only
source of who is there. The interaction policy adds a check to the login prompt
(`!result.login`) and to the consent prompt (`!result.consent`), so **every**
authorization request goes through SD's interaction, once, whatever the
provider session remembers. The provider interaction URL is the absolute
`<issuer>/api/oauth/interaction/<uid>` (the `_interaction` cookie path is its
pathname, which must keep the `/simple-directory` prefix and the site path).

1. `GET /api/oauth/authorize` (provider): validates the client, redirect URI,
   PKCE, `resource` and scope, then redirects to the interaction entry.
2. `GET /api/oauth/interaction/<uid>` (SD): without a session, redirects to the
   site login with the entry URL as `redirect`. With a session that may not
   consent (below), redirects to `/oauth/consent?error=forbidden`. Otherwise it
   records the user who opened the interaction (`result.sd.userId`) and, for a
   site client of implicit consent, finishes right away; in every other case it
   redirects to the SPA consent page with `uid`.
3. `GET /api/oauth/interaction/<uid>/details` (SD, JSON): what the page shows
   (client, resource, scopes with broad ones flagged, accounts or NHIs).
4. `POST /api/oauth/interaction/<uid>` (SD, JSON): the decision (`allow` or
   `deny`). It creates the grant and answers `{ redirectTo }`, the provider's
   resume URL, which issues the code to the client's redirect URI.

Consequences and rules:

- **`prompt=none` always yields `login_required`.** The interaction is forced,
  so there is no silent re-authorization, even for an implicit site client.
- **A session may consent only if it is a plain user session.** Refused: a
  scoped session, an NHI, a user of an organization storage, and an
  impersonation (`asAdmin`) session, which never obtains a token in the name of
  the impersonated user. A superadmin in admin mode consents as the plain user;
  no admin claim reaches any token.
- **One decision per interaction.** The decision takes a lock in
  `oauth-interaction-decisions` (TTL = the interaction's); a replay or a
  concurrent second request is refused (400) and creates no second grant. A
  decision by another logged-in user than the one who opened the interaction is
  refused (403). A decision that fails after the lock undoes the grant, the
  scope merge, an inline NHI and the lock.
- **Switching subject in one browser works.** User A then user B, or a user
  grant then an NHI grant: when the provider session belongs to another
  account, SD destroys it and detaches the interaction before resuming
  (`detachForeignSession`), so the provider does not render its end-session
  form and each token has the right `sub`. The remaining case is a two-tab race:
  if another subject finishes an authorization in the same browser between the
  start of an interaction and its decision, the provider may still show its
  end-session form. No token goes to the wrong subject, the user restarts.
- **Scopeless requests.** A request without a `scope` parameter (or without any
  platform scope) is accepted by the provider only if the grant covers its
  request, so the scopes chosen at consent are added to the stored request.
- **Errors.** Provider errors that cannot be redirected to the client, and
  errors of the entry route, go to `<issuer>/oauth/consent?error=<code>`; the
  details and decision routes answer JSON. The page shows an `error` value only
  if it looks like a code (`^[a-z_]{1,64}$`), anything else gets the generic
  message with a fixed code, so the parameter cannot put arbitrary text on an
  SD page.
- **The consent page cannot be framed.** The SPA serves `/oauth/consent` (and
  the spellings the UI router accepts: any case, trailing slash) with
  `frame-ancestors 'none'` and `X-Frame-Options: DENY`, not the `'self'` /
  `SAMEORIGIN` of the other pages, so not even a same-origin page (portal
  content on the shared host) can frame the decision (`api/src/app.ts`).

**Consent of a user for a site client.** The user chooses the account the
grant is bound to: the personal account (unless `ignorePersonalAccount`) or one
of their memberships (department included), the default account of the site
first. The consent screen lists the scopes within the client's registration and
the request, nothing hidden, whole-resource and `all:*` scopes flagged. A client
with `consent: implicit` skips the screen for a user who is a member of the
owner organization of the issuer site (the grant is bound to that
membership); `prompt=consent` forces the screen. The grant lasts 30 days.

**Consent of an org admin for a dynamic client.** The consenting user must be a
real admin of an organization: the memberships themselves, never admin mode nor
the site-admin fallback of the NHI page (department admins only with
`depAdminIsOrgAdmin`). The admin binds the client to:

- an existing NHI of the organization without `ipBinding` (the caller of the
  token endpoint is not the API caller, so a bound session would be unusable),
  whose maximum scopes bound the grant, or
- a new NHI created inline, with the same validations as `POST /nhis` (role,
  known scopes, member limit; no key binding; the admin recorded as creator; an
  empty maximum means the ticked scopes).

Nothing is preselected, broad scopes are flagged, NHIs that could not be
granted any requested scope are not offered, and the lifetime is one of `1d`,
`7d`, `30d` (default), `90d`, `1y`. The token subject is the NHI, the admin is
recorded as `authorizedBy`. An MCP resource requires this NHI subject. ID
tokens carry `sub` only for an NHI: `profile` and `email` are rejected. Scope
narrowing is literal: an umbrella requested scope is not split by a narrower
NHI maximum. The member-limit check has the same race as `POST /nhis`.

### Scopes

The OIDC values `openid`, `profile`, `email` and `offline_access` are stripped
from the platform scope: they never appear in the `scope` of an access token.
The platform scope is `narrowScope(requested, maximum)`: requested scopes the
maximum does not cover are dropped silently, an empty result is
`invalid_scope` at the authorization step and an error on the decision. The
maximum is the registration of a site client, or the `scopes` of the NHI (every
known scope when it is unrestricted). The token's scope is never wider than the
grant record's, and it is re-narrowed against the current maximum at every
issuance. `openid`, `profile` and `email` are honoured for user subjects only.

### Grant records and revocation

At consent SD creates the provider `Grant` itself and writes its record in the
`sd` field of the same `oauth-grant` document: issuer, site, client (id, name,
kind), subject (`user` or `nhi`), the bound account, scope, the single
resource, `authorizedBy`, `createdAt`, `expiresAt` and `lastUsedAt`. The adapter
updates documents partially, so the provider's own saves keep the record, and
whatever destroys the `Grant` (revocation, reuse detection, expiry) removes the
record with it. The record is what people see, audit and revoke; the provider
`Grant` is what its tokens hang on. A grant has exactly one resource.

Revocation (`revokeGrant`) removes the refresh tokens and codes of the grant
(access tokens are JWTs, never stored), then the `Grant` document with its
record, and logs `sd.oauth.grant.revoked`. It happens on:

- the user revoking from the account page (`GET
  /api/users/:userId/oauth-grants` and `DELETE
  /api/users/:userId/oauth-grants/:grantId`, the user's own site client grants; a
  superadmin in admin mode may act for others; an NHI session may not);
- an org admin revoking the grants of an NHI, per client or one by one
  (`/api/organizations/:orgId/nhis/:nhiId/oauth-grants`);
- a client calling `POST /api/oauth/revoke` with its own refresh token (the
  provider destroys the grant, its record with it);
- removing a site client, deleting a site, deleting a user or an NHI (mongo
  storage; the LDAP and file storages are read-only, their deletion is
  noticed lazily by the failing re-check at refresh);
- refresh token reuse (below).

### Token issuance, refresh and reuse

The code exchange and every refresh re-read the grant record and the current
subject (`checkGrantSubject`) and rebuild the claims from them; any failure is
`invalid_grant` and the reason stays in the debug log. Re-checked: the record
exists and is not expired, same issuer, subject type versus client kind, the
user or NHI exists and has not changed type, the resource still resolves in
the realm, for an NHI its organization binding, `ipBinding` absent,
`allowedIps` and `assertNhiMayTarget`, for a user subject the site client still
exists and still registers the resource, the bound membership still exists
(department matched strictly), and the scope still narrows to something.

- The `organizations` claim holds at most the one account bound at consent;
  `[]` is the user's personal account.
- A refresh with a narrower platform `scope` gets that narrower scope. A
  refresh requesting only OIDC scopes (for example `openid`) keeps the full
  platform scope of the grant.
- A user who lost the bound membership gets `invalid_grant`; a site client
  whose scopes shrank gets a narrower scope, never an empty one (empty is
  `invalid_grant`).
- Refresh tokens are issued for every code exchange of a client allowed
  `refresh_token` (`offline_access` is not required) and **rotated on every
  use**. A refresh token lives `min(7 days, grant expiry - now)`.
- **Reuse revokes the whole grant, with no grace window.** Presenting an
  already used refresh token makes the provider destroy the grant (SD logs
  `sd.oauth.grant.reused` (warn) with the client, subject, account and
  authorizing person from `findAccount`, which the provider calls just before
  its consumed check), and the newest token is then
  `invalid_grant` too. Reuse is detected before the subject re-checks, so it
  is still detected when those fail first. A client that loses a refresh
  response has to authorize again. Consuming a code or a refresh token is a
  conditional update in the adapter: of two concurrent uses one wins, the
  other gets `invalid_grant`, and the next presentation of the old token is a
  reuse.
- Every successful exchange touches `lastUsedAt` of the record.

### The revocation gap of JWT access tokens

Access tokens are stateless JWTs. The revocation endpoint rejects them
(`unsupported_token_type`), and revoking a grant does not invalidate access
tokens already issued: they live out their lifetime, 15 minutes for a user
subject (`jwtDurations.idToken`), 30 minutes for an NHI
(`jwtDurations.nhiToken`). Everything else stops at once, since a refresh
needs the grant. This is the bound to reason with when a grant must be cut.

### Lifetimes

| Object | Lifetime |
| --- | --- |
| access token | 15 min (user subject), 30 min (NHI subject) |
| grant | 30 days (site client); `1d`, `7d`, `30d`, `90d` or `1y` chosen at consent (dynamic client); set as `grant.exp` before saving |
| refresh token | `min(7 days, grant expiry - now)`, rotated on every use |
| authorization code | 60 s |
| provider session | 10 min (it is a technical artefact, SD's session decides) |
| interaction | 30 min |

### Rate limits and events

Shared limiter (`api/src/utils/limiter.ts`), keys prefixed:

- token endpoint: `client_credentials` (and the JWT bearer grant) per raw IP
  and per `client_id` (an NHI has one owner), the keys of `/nhi-token`;
  `authorization_code` and `refresh_token` in their own namespace,
  `oauth-token-ip:<ip>` and `oauth-token-client:<client_id> <ip>`, whatever the
  request claims about client authentication. Their own namespace because
  routine failures (a grant that ended, an idle refresh token, a lost
  membership) of many users behind one office address must not lock that
  address out of password login, 2FA, anonymous actions and the NHI exchange,
  which share the raw IP key; per client and address because the id of a
  public client is public and a per-id bucket would let anyone lock out its
  users. Same budget (`authRateLimit`), consumed up front and refunded on
  success, so only failures count;
- registration: `oauth-dcr:<ip>`, successes count (never refunded);
- CIMD fetches: `oauth-cimd:<ip>` on cache misses, successes count;
- consent decision: `oauth-consent:<userId>`, refunded on success.

Events (`eventsLog`): `sd.oauth.grant.created`, `sd.oauth.grant.revoked`
(info), `sd.oauth.grant.reused` (warn), `sd.oauth.client.registered`,
`sd.oauth.consent.denied` (info), `sd.oauth.rate-limit` (warn). Token
issuance stays at debug level. Client chosen strings go through `logSafeName`
(control, bidi and zero-width characters stripped, truncated) before they reach
a log line. When the global fetch dispatcher is not undici's `Agent` (a proxy
dispatcher), CIMD and `jwks_uri` fetches fail closed and an `internalError`
(`oauth-ssrf-dispatcher`) is logged once.

## Errors

- JWT bearer, any failure to identify or verify the NHI (unknown client, wrong
  site, `allowedIps`, bad assertion, NHI may not target that site): a uniform
  `400 invalid_grant` after a random delay, the real cause only in the
  `sd.auth.nhi.fail` log.
- Unknown or out-of-realm resource: `invalid_target`, checked before the NHI is
  loaded so it reveals nothing about the NHI.
- Bad `scope`: `invalid_scope`. Malformed or repeated parameters:
  `invalid_request`. Rate limit: 429.
- `client_credentials`: the client is already authenticated by the provider,
  so precise errors are not an oracle. An NHI not allowed on a known site is
  `invalid_target`.

## Flags

| Config | Effect |
| --- | --- |
| `oauthServer.enabled` (`OAUTH_SERVER_ENABLED`) | Master switch: everything under `/api/oauth/` and the discovery documents is 404 when off. |
| `oauthServer.siteClients` (`OAUTH_SERVER_SITE_CLIENTS`) | Site clients: applications registered in the site settings (dashboards), acting for a user after the user's consent. Off: site clients are unknown to the provider, at authorization as at refresh. |
| `oauthServer.agentClients` (`OAUTH_SERVER_AGENT_CLIENTS`) | Agent clients: unregistered applications, through a client id metadata document (CIMD) or dynamic client registration (DCR), acting as an NHI after an org admin's consent. Off: the registration route is 404, CIMD is disabled and registered clients are unknown. |
| either of the two | The authorization code flow they share: authorization, resume, revocation, the interaction routes, refresh tokens and consent. Both off: those routes are 404 and discovery drops the authorization endpoint and the code and refresh grants. |
| `mcpPath` (`MCP_PATH`) | Path segment marking an MCP resource, default `/mcp-server` (where the platform routes the mcp service). |
| `manageNhis` | Both machine grants. Off: discovery advertises neither `client_credentials` nor the JWT bearer grant. |
| `mainSiteFromDb` containing `oauthClients` | Site clients of the main site are read from its document (see [`main-site-config.md`](main-site-config.md)). Without it the main issuer has no site client. |

Both client flags are `false` in `default.cjs` and on in `development.cjs` and
`test.cjs`. A provider is cached with the flags in its cache key, so a flag
change rebuilds it.

Discovery advertises only what is served: endpoints that are not routed
(userinfo, introspection, PAR, logout, registration management) are disabled
in the provider configuration, and `grant_types_supported` is filtered by the
flags above (no `implicit`). DPoP is disabled (no resource server enforces
sender-constrained tokens). Revocation is enabled with the code flow, and a
client can revoke its own tokens only. `response_types_supported` is `code`,
PKCE is required for every client, and the client authentication methods are
`private_key_jwt` (NHI clients, dynamic clients that registered a key) and
`none` (public clients) once the code flow is on, `private_key_jwt` only
before. Without the authorization code flow, `response_modes_supported` and
`authorization_response_iss_parameter_supported` are dropped too. `jwks_uri`
points to the scoped key set. Internal requests (no site
context) get 404 on all of it.

## Routes

The dispatcher forwards exactly these canonical paths and nothing else under
`/api/oauth/` (the provider's router is case insensitive and tolerates
trailing slashes, so variants are 404 before they reach it):

| Endpoint | Path | Flag |
| --- | --- | --- |
| token | `POST /api/oauth/token` | enabled |
| discovery | `/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server` | enabled |
| authorization | `/api/oauth/authorize` | siteClients or agentClients |
| resume | `GET /api/oauth/authorize/<uid>` (the provider's) | siteClients or agentClients |
| revocation | `POST /api/oauth/revoke` | siteClients or agentClients |
| registration | `POST /api/oauth/register` (no management routes) | agentClients |
| interaction entry | `GET /api/oauth/interaction/<uid>` (SD route) | siteClients or agentClients |
| interaction details | `GET /api/oauth/interaction/<uid>/details` (SD route) | siteClients or agentClients |
| interaction decision | `POST /api/oauth/interaction/<uid>` (SD route) | siteClients or agentClients |

`<uid>` is a 43 character url-safe nanoid. The three interaction routes are
Express routes of SD mounted **after** the session middleware (they read the
cookie session), so the dispatcher lets them through with `next()` instead of
handing them to the provider. The consent page itself is an SPA page,
`<issuer>/oauth/consent`.

## Invariants

1. **No cookies from OAuth.** The token endpoint never sets a session cookie
   and never creates a server session; the output is a bearer token only. The
   consent routes read the cookie session but the authorization flow never
   writes one.
2. **No superadmin claims.** `isAdmin`, `adminMode` and `asAdmin` are removed
   in `sdClaims` and again in the provider customizer, whatever the user is.
   An impersonation session never consents.
3. **An MCP audience means an NHI subject.** Enforced three times: the
   resource hook refuses an MCP resource to a site client, `createConsentGrant`
   refuses to record a user grant for one, and `checkGrantSubject` refuses it at
   every issuance.
4. **Realm confinement.** A resource must belong to the realm of the issuer,
   and an issuer site is its own account main site.
5. **The NHI site rule.** An NHI is only issued a token for the main site or a
   site owned by its own organization, in every grant (`assertNhiMayTarget`),
   as in `/nhi-token`.
6. **One exchange.** Rate limiting, `allowedIps`, assertion verification and the
   `exp` cap are those of `nhis/exchange.ts`, not reimplemented per grant.
7. **Only what is served is advertised.** Discovery follows the flags.
8. **A dynamic client is always bound to an NHI chosen by an org admin.** The
   subject of its grants is that NHI, never the person who clicked; the NHI
   has no `ipBinding`; the token is never wider than the NHI maximum, the
   request and the chosen scopes.
9. **Every authorization goes through SD's interaction.** The login and
   consent prompts are forced, so there is no silent re-authorization
   (`prompt=none` is `login_required`), and a grant exists only if SD created
   it at a consent decision.
10. **Subject and scope are re-read at every issuance.** The grant record, the
    user or NHI, the bound membership, the client registration and the
    maximum are checked as they are now; the scope can only narrow.
11. **A reused refresh token revokes its grant.**
12. **No redirect URI is matched by prefix or wildcard.** The only relaxation
    is the port of a loopback redirect URI of an all-loopback dynamic client.
13. **No scope wider than the request, the client's registration or the NHI
    maximum.**
14. **Reserved to site clients:** custom CORS origins (`sd_allowed_origins`)
    and the user subject. Reserved to dynamic clients: the NHI subject.

## Known accepted surfaces

- JWT access tokens cannot be revoked individually; the 15 minute (user) or
  30 minute (NHI) lifetime is the bound (disabling the NHI or revoking the
  grant stops renewals).
- The rate limiter of the machine grants is keyed on a `client_id` that is not
  verified at that point, so a caller can drain an NHI's bucket from many IPs.
  Pre-existing with `/nhi-token`. The code and refresh grants are keyed per
  address for that reason.
- The JWT bearer grant has no assertion replay store (as `/nhi-token`, see
  `non-human-identities.md`); `client_credentials` assertions are
  replay-protected by the provider.
- The two-tab race of the subject switch (above) can show the provider's
  end-session form; the user restarts the authorization.
- The member-limit check of an NHI created inline at consent has the same race
  as `POST /nhis`.
- Open registration and CIMD are bounded by rate limits, the SSRF safe fetch
  and the consent of an org admin, not by an initial access token.

## Dependency on the lib

Services accept these tokens through `@data-fair/lib-express`. Its bearer
audience check -- `aud` must contain the request's site URL, and an internal
request without `x-forwarded-host` is refused -- is released separately in the
lib; services upgrade it only after this server is deployed.

SD itself runs the strict lib, which has two visible effects on upgrade:

- a bearer access token is refused (401) on an internal request, one without
  `x-forwarded-host`: internal callers must use the public URL or a session;
- access tokens returned by `/api/auth/nhi-token` before the upgrade carry no
  `aud` and are refused, for at most their 30 minute lifetime. The NHI only
  has to request a new one.
