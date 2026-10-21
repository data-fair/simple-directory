# OAuth authorization server

How simple-directory issues OAuth 2.0 access tokens, for whom, for which
resources, and the invariants that keep it from becoming a way around the NHI
confinement or the session protections. Required reading for changes under
`api/src/oauth-server/`, the token endpoint, the consent screens or discovery.

See also [`non-human-identities.md`](non-human-identities.md) (the NHI model and
the assertion exchange the machine grants reuse),
[`session-theft-protections.md`](session-theft-protections.md) and
[`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md).
`api/src/oauth/` is the unrelated SD-as-client code for external identity
providers.

## Shape

`oidc-provider` does the protocol work; SD plugs into its extension points
rather than around them:

| File | Role |
| --- | --- |
| `router.ts` | dispatcher: an allowlist of exact canonical routes (the provider's router is case insensitive and tolerates trailing slashes, a variant would skip SD's checks), the issuer of the request, rate limits, the JWT bearer grant |
| `providers.ts` | one provider per issuer, rebuilt on a scoped key rotation or a flag change; provider events and the response middleware |
| `configuration.ts` | the provider configuration: adapter chain, `getResourceServerInfo`, `findAccount`, `extraClientMetadata.validator`, `extraTokenClaims`, interaction policy, discovery overrides |
| `issuers.ts` | issuers, realm, resource resolution, the NHI site rule |
| `clients.ts`, `dynamic-clients.ts` | client kinds, site clients, CIMD/DCR rules, the SSRF safe fetch |
| `interaction.ts`, `consent.ts` | SD's login handoff and consent (Express routes, after the session middleware) |
| `grants.ts`, `grant-subject.ts`, `grants-router.ts` | grant records, revocation, the re-check at every issuance, connected applications |
| `adapter.ts`, `access-token.ts`, `jwt-bearer.ts` | mongo storage of provider models, claims, the JWT bearer grant |

Tokens are RFC 9068 `at+jwt` signed with the **scoped** key set (discovery's
`jwks_uri` is `/.well-known/scoped-jwks.json`), never with the session keys.

## Flags

| Config | Serves |
| --- | --- |
| `oauthServer.enabled` | everything under `/api/oauth/` and the two discovery documents (404 when off) |
| `manageNhis` | the machine grants (`client_credentials`, JWT bearer) |
| `oauthServer.siteClients` | site clients: dashboards registered in the site settings, acting for a user |
| `oauthServer.agentClients` | agent clients: CIMD and DCR, acting as an NHI; the registration route |
| either client flag | the code flow they share: authorize, resume, revoke, the interaction routes, refresh tokens |
| `mcpPath` | the path segment of an MCP resource (default `/mcp-server`) |
| `mainSiteFromDb` with `oauthClients` | site clients of the main site, read from its document ([`main-site-config.md`](main-site-config.md)) |

A flag off makes its clients unknown, at authorization as at refresh. The
client flags are off in `default.cjs`, on in development and test. Discovery
advertises only what is served: it is computed by the provider from this
configuration, plus `discoveryOverrides` for what configuration cannot say (the
scoped jwks, the live platform scopes, the JWT bearer grant, and without the
code flow the removal of the authorization endpoint the provider always lists).
Disabled in the provider: userinfo, introspection, PAR, logout, registration
management, device flow, DPoP. Internal requests (no site context) get 404.

The served routes: `POST /api/oauth/token`, the discovery documents, and with
the code flow `/api/oauth/authorize` (and the provider's resume
`/api/oauth/authorize/<uid>`), `POST /api/oauth/revoke`, `POST
/api/oauth/register` (agent clients) and SD's interaction routes
`/api/oauth/interaction/<uid>` and `/api/oauth/interaction/<uid>/details`.

## Issuers, realm and resources

| Request site | Issuer |
| --- | --- |
| main site | `config.publicUrl` |
| an account main site, or a standalone `onlyLocal` site whose owner has no designated main site | `<site url>/simple-directory` |
| anything else | none: 404 |

The request URL must be the canonical URL of the resolved site (the site lookup
is a host plus path prefix match, the default audience must not name a site of
another realm), and an issuer site must be its own account main site (a flag
alone does not make an issuer). The **realm** of an issuer is the set of sites
whose account main site it is.

A `resource` (RFC 8707) is parsed strictly (same scheme as the site, no query,
fragment, userinfo or `//`) and reduced to origin plus path. Without it the
target is the issuer site.

- **API resource**: a site of the realm; `aud` is its URL.
- **MCP resource**: a URL containing `<mcpPath>/`; `aud` is `[<site><mcpPath>,
  <site>]`, the MCP server and the API it fronts. Reserved to NHI subjects.
- Unknown or outside the realm: `invalid_target`.
- An NHI may only target the main site or a site owned by its organization
  (`nhiMayTarget`, department tolerant, the rule of `/nhi-token`).

## Clients

A client id is classified by its shape alone (`clientKind`). The adapter's
`Client.find` chains NHI, site client, stored DCR client; the provider resolves
CIMD itself.

| Kind | Id | Subject | Authentication | Resources | Consent |
| --- | --- | --- | --- | --- | --- |
| NHI | `nhi-<id>` | the NHI, `client_credentials` only | `private_key_jwt` against its inline `jwks` | realm | none |
| site client | `site-<nanoid>` | a **user** | none (PKCE) | its registered `resources` (default the issuer site), never MCP | the user |
| CIMD | its https document URL | an **NHI** | none or `private_key_jwt` | realm, MCP included | an org admin |
| DCR | `dcr-<nanoid>` | an **NHI** | none or `private_key_jwt` | realm, MCP included | an org admin |

**Site clients** live in the `oauthClients` list of an issuer site, edited by
superadmins only; the id is generated once and never moves between sites.
Redirect URIs are `https` (or `http` on a loopback host), without fragment or
credentials, matched exactly; `scopes` are checked against the known scopes on
save. `allowedOrigins` (bare origins of the same kinds, default: the origins of the
redirect URIs) are the CORS origins of the token and revocation endpoints, a
privilege reserved to site clients. With its token a dashboard calls the APIs
from the browser: every scope-aware service answers bearer calls from any
origin without credentials (lib-express `session.bearerCors()`, mounted after
the authorization server in `app.ts`). Removing a client or deleting its site
revokes its grants.

**Dynamic clients** are agents nobody registered by hand: open registration (no
initial or registration access token, a registration is final) and CIMD. Their
rules live in one place, `checkDynamicMetadata`, run by the provider's
`extraClientMetadata.validator` on every client it builds (registration, CIMD
document, stored client):

- authentication `none` or `private_key_jwt`; grant types `authorization_code`
  and `refresh_token`; response type `code`;
- `sd_allowed_origins` and `sector_identifier_uri` refused; `logo_uri`,
  `client_uri`, `policy_uri`, `tos_uri`, `jwks_uri` `https` only;
- redirect URIs: `https` (not a loopback host), loopback `http`, or a
  private-use scheme with a dot (RFC 8252 7.1); never `javascript:`, `data:`,
  `file:`, `vbscript:`, `blob:`, `about:`, a fragment or credentials. Loopback
  mixed with a private-use scheme is refused;
- `application_type` is set from the parsed URIs, whatever the client sent:
  `native` when they are all loopback or include a private-use scheme, `web`
  otherwise. The provider ignores the port of a loopback URI only for native
  clients, so the port relaxation applies only to an all-loopback client;
- a CIMD document is fetched through `ssrfFetch` (lib-node SSRF rules, IP
  literals checked, no redirect followed, the provider's timeout and 5 KB
  limit). A test-only fixture hook serves documents from memory, only with
  `ENABLE_TEST_API=1`. When the global dispatcher is not undici's `Agent`, fetches fail
  closed (`internalError` `oauth-ssrf-dispatcher`, logged once);
- DCR clients are stored per issuer; those older than 30 days without a live
  grant are deleted by the users worker.

On the consent screen an unverified client never has a logo: its self-declared
name (control, bidi and zero-width characters stripped, truncated:
`logSafeName`), its id URL (CIMD) or the fact that it registered itself, and the
redirect host, in WHATWG serialization (a lookalike host shows punycoded).

## Machine grants

Both are for NHIs only (`manageNhis`), `client_id` the NHI id.

- **JWT bearer (RFC 7523 2.1)**, answered by SD ahead of the provider: a
  provider client has one authentication method, and a cluster-issued
  assertion (a Kubernetes service account token) cannot be a `private_key_jwt`
  client assertion. It runs the exchange of `/api/auth/nhi-token`
  (`nhis/exchange.ts`: rate limit, site ownership, `allowedIps`, assertion
  verification, `exp` cap) without cookies. Every identification failure is a
  uniform `invalid_grant` after a random delay; an unknown resource is
  `invalid_target`, checked before the NHI is loaded.
- **`client_credentials` with `private_key_jwt`**: NHIs with inline `jwks` only
  (`findNhiClient`, synthesized on every lookup). The provider rejects replayed
  client assertions; the client is authenticated, so errors are precise (an NHI
  not allowed on a known site is `invalid_target`).

## Authorization code flow

The provider keeps no login state: SD's cookie session decides. The
interaction policy forces the login and consent prompts (`sd_login`,
`sd_consent`), so **every** authorization goes through SD once and
`prompt=none` is always `login_required`. A grant exists only if SD created it
at a consent decision (`loadExistingGrant` loads that one only).

1. `GET /api/oauth/authorize` (provider): client, redirect URI, PKCE (required,
   S256), resource and scope, then the interaction entry.
2. `GET /api/oauth/interaction/<uid>`: no session → the site login; a session
   that may not consent → `/oauth/consent?error=forbidden`; otherwise the user
   is recorded on the interaction and the browser goes to the SPA consent page.
3. `GET …/details`: client, resource, scopes (broad ones flagged), accounts or
   organizations and NHIs.
4. `POST …/<uid>`: the decision, validated by `#doc/oauth/post-consent-req`,
   answers `{ redirectTo }`, the provider's resume.

**Who may consent.** A plain user session only: never a scoped or NHI session,
an organization storage user, or an impersonation (`asAdmin`); a superadmin
consents as the plain user. The request must also carry the exchange token of a
**live and current server session** of that user (`reqServerSessionId`, the
check keepalive applies): a copied `id_token` alone, or a rotated-out exchange
cookie, cannot authorize a client. A user's grant records that session and is
revoked with it; an NHI grant does not, it does not act as the admin who
authorized it.

**One decision per interaction.** A lock in `oauth-interaction-decisions`: a
replay or a concurrent decision is 400 and creates nothing; a decision by
another user than the one who opened the interaction is 403. A decision that
fails after the lock ends the interaction (its grant is removed, the lock
stays); the person restarts from the client.

**A user for a site client.** The user binds the grant to their personal
account (unless `ignorePersonalAccount`) or one of their memberships, the
site's default account first; the screen lists the requested scopes within the
registration. Every authorization shows the screen (no implicit consent).
30 days.

**An org admin for a dynamic client.** Only a real admin membership (department
admins with `depAdminIsOrgAdmin`), never admin mode nor the site-admin
fallback. The admin binds the client to an NHI of the organization; NHIs are
only created and managed on the organization page (`POST /nhis`, a key binding
optional), never at consent, so the list stays the one admins curate. The
screen says so and links there when the organization has none. Nothing is
preselected; NHIs that could get none of the requested scopes are not offered;
the lifetime is `1d`, `7d`, `30d` (default), `90d` or `1y`. The subject is the
NHI, the admin is `authorizedBy`. An NHI gets no identity claim.

**Scopes.** Platform scopes are resource scopes, read live (`knownScopeNames`,
refreshed from data-fair); the provider's static list holds the OIDC ones.
`narrowScope(requested, maximum)` drops what the maximum (site client
registration, NHI scopes) does not cover; empty is `invalid_scope`. A request
without a platform scope gets the chosen scopes merged into its stored request.
`openid`, `profile`, `email` are honoured for users only and never appear in an
access token's `scope`. Narrowing is literal: an umbrella requested scope is not
split by a narrower NHI maximum.

**Subject switch.** When the provider session belongs to another account, SD
destroys it before resuming (`detachForeignSession`), so user A then user B, or
a user grant then an NHI grant, work in one browser.

**Errors and framing.** Errors that cannot go back to the client land on
`<issuer>/oauth/consent?error=<code>`; the page shows only values matching
`^[a-z_]{1,64}$`. `/oauth/consent` (every spelling the UI router accepts) is
served with `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

## Grants, refresh and revocation

The SD record of a grant is the `sd` field of the provider's own `oauth-grant`
document: issuer, client, subject, bound account, scope, the single resource,
`authorizedBy`, the consenting `sessionId`, dates. The adapter updates
documents partially, so provider saves keep it, and whatever destroys the
Grant removes it.

At the code exchange and every refresh `findAccount` re-checks the grant
(`checkGrantSubject`): record live, same issuer, subject type matching the
client kind, subject still existing with the same type, resource still in the
realm; for an NHI its single organization, `allowedIps`,
`nhiMayTarget` and its authorizing admin still an admin of the organization;
for a user the site client and its resource registration, and the bound
membership (department exact). The scope can only narrow; empty or any failure
is `invalid_grant` (reason in the debug log). The `organizations` claim holds
the bound account only (`[]` for the personal account). A refresh may ask for a
narrower platform `scope`; one asking only OIDC scopes keeps the grant's.
Every successful exchange touches the record's `lastUsedAt`.

Refresh tokens come with every code exchange of a client allowed
`refresh_token` and **rotate on every use**. Presenting a used one revokes the
whole grant, no grace window, even when the subject checks would fail
(`findAccount` logs `sd.oauth.grant.reused` before the provider's consumed
check). Consuming a code or refresh token is a conditional update: of two
concurrent uses one wins, the other gets `invalid_grant`.

Revocation removes the refresh tokens, codes and the Grant with its record:

| Event | Grants revoked |
| --- | --- |
| user, account page (`/api/users/:id/oauth-grants`; a superadmin in admin mode for others, never an NHI session) | the chosen one |
| org admin, NHI page (`/api/organizations/:org/nhis/:nhi/oauth-grants`) | per client or one |
| client, `POST /api/oauth/revoke` with its refresh token (an access token is `unsupported_token_type`) | its own grant |
| revoke all sessions of a user | the user's grants |
| revoke one session, or exchange token reuse at keepalive | the user's grants consented from that session |
| site client removed, site deleted, user or NHI deleted | theirs (LDAP and file deletions are noticed at the next refresh) |
| refresh token reuse | that grant |

A logout or a password change keeps the grants (they keep the sessions too; a
dashboard outlives the browser session that authorized it).

## Tokens

Claims: `iss`, `sub` (the user or NHI), `client_id` (the client; the NHI for
the machine grants), `aud` as above, `jti`,
`iat`, `exp`, `scope` (the narrowed platform scope), and the SD payload of the
subject for the target site (`getTokenPayload`) handed over by
`extraTokenClaims`, minus `isAdmin`, `adminMode`, `asAdmin`; `boundIp` for an
NHI with `ipBinding`, the IP of each token request (code exchange and refresh
included: an MCP server relays its caller's IP as a trusted forwarder, so the
agent that got the token is the address the API sees). ID tokens: `sub`, plus `name` and
`email` for a user with `profile` / `email`.

| Object | Lifetime |
| --- | --- |
| access token | 15 min (user), 30 min (NHI, never past the assertion `exp`) |
| grant | 30 days (site client), chosen at consent (dynamic client) |
| refresh token | `min(7 days, grant expiry)`, rotated |
| code / interaction / provider session | 60 s / 30 min / 10 min |

Access tokens are stateless JWTs: revoking a grant stops renewals at once, the
tokens already issued live out their lifetime.

## Rate limits and events

Shared limiter (`utils/limiter.ts`), consumed up front and refunded on success
unless noted:

- `client_credentials` and JWT bearer: the `/nhi-token` keys (raw IP and
  `client_id`);
- `authorization_code` and `refresh_token`: `oauth-token-ip:<ip>` and
  `oauth-token-client:<client_id> <ip>`, their own namespace so routine
  failures of many users behind one address do not lock out password login, and
  per address because a public client id is public;
- registration `oauth-dcr:<ip>` and CIMD fetches of an authorization request
  `oauth-cimd:<ip>`: never refunded. The consent routes' lookups of an
  interaction's client are not counted, the authorization request admitted it;
- consent decision `oauth-consent:<userId>`.

Events: `sd.oauth.grant.created`, `sd.oauth.grant.revoked`,
`sd.oauth.grant.reused` (warn), `sd.oauth.client.registered`,
`sd.oauth.consent.denied`, `sd.oauth.rate-limit` (warn); client chosen strings
go through `logSafeName`.

## Invariants

1. **No cookies from OAuth.** The token endpoint never sets a cookie nor
   creates a server session (`router.ts`, `jwt-bearer.ts`); the consent routes
   read the cookie session, the flow never writes one.
2. **No admin claims.** Stripped in `sdClaims` and `extraTokenClaims`; an
   impersonation session never consents (`refuseConsentUser`).
3. **An MCP audience means an NHI subject**: the resource hook, then
   `createConsentGrant`, then `checkGrantSubject`.
4. **Realm confinement**: resources inside the issuer's realm, an issuer is its
   own account main site (`issuers.ts`).
5. **The NHI site rule** in every grant (`nhiMayTarget`), as in `/nhi-token`.
6. **One exchange** for the machine grants (`nhis/exchange.ts`).
7. **Only what is served is advertised** (dispatcher allowlist, provider
   configuration, `discoveryOverrides`).
8. **Every authorization goes through SD's interaction**, forced prompts, and
   a consent needs a live, current server session.
9. **A dynamic client is always bound to an NHI chosen by an org admin**, still
   an admin at every issuance; site clients have user subjects only.
10. **Subject and scope are re-read at every issuance**; the scope only
    narrows.
11. **Refresh reuse revokes the grant**; consumption is atomic.
12. **No redirect URI is matched by prefix or wildcard**, the loopback port of
    an all-loopback dynamic client excepted.
13. **No scope wider than the request, the registration or the NHI maximum.**
14. **Custom CORS origins are reserved to site clients** (`sdClientBasedCORS`).

## Known accepted surfaces

- JWT access tokens cannot be revoked individually (15 or 30 minutes).
- The machine grants' limiter is keyed on an unverified `client_id`, so an
  NHI's bucket can be drained from many addresses (as `/nhi-token`).
- The JWT bearer grant has no assertion replay store (as `/nhi-token`).
- A two-tab race between subjects in one browser can show the provider's
  end-session form; the user restarts.
- Open registration and CIMD are bounded by rate limits, the SSRF safe fetch
  and an org admin's consent, not by an initial access token.

## Dependency on the lib

Services accept these tokens through `@data-fair/lib-express`, whose bearer
check requires `aud` to contain the request's site URL and refuses internal
requests (no `x-forwarded-host`); services upgrade the lib only after this
server is deployed. Upgrading SD to it means a bearer token on an
internal request is 401, and `/api/auth/nhi-token` tokens issued before the
upgrade (no `aud`) are refused for at most their 30 minutes.
