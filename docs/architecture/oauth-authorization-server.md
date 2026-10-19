# OAuth authorization server

How simple-directory issues OAuth 2.0 access tokens to non-human identities
(NHIs) at `/api/oauth/token`, which site is the issuer of those tokens, which
resources a token can target, and the invariants that keep the endpoint from
becoming a way around the NHI confinement. This is milestone M1 (machine
grants only); the authorization code flow for human users and dynamic client
registration are later milestones and are off. Required reading for changes
under `api/src/oauth-server/`, the token endpoint or discovery.

See also [`non-human-identities.md`](non-human-identities.md) (the NHI model
and the assertion exchange this endpoint reuses) and
[`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md)
(site isolation). `api/src/oauth/` is the unrelated SD-as-client code for
external identity providers; the server lives in `api/src/oauth-server/`.

## Shape

`oidc-provider` (node-oidc-provider) does the protocol work (discovery,
`client_credentials`, private_key_jwt client authentication, revocation,
resource indicators). SD wraps it:

- `router.ts` is a dispatcher mounted on `/api/oauth/*` and the two
  `/.well-known/{openid-configuration,oauth-authorization-server}` documents.
  It resolves the issuer from the request site, answers the JWT bearer grant
  itself, and hands everything else to the provider of that issuer.
- `providers.ts` caches one provider per issuer, rebuilt when the scoped
  signing key rotates or the issuer context (site, site `updatedAt`) changes,
  because the provider's hooks read the context through closures.
- `configuration.ts` holds the provider configuration, the resource hook and
  the discovery overrides; `access-token.ts` the claims; `issuers.ts` the
  issuer and resource rules; `clients.ts` the client lookup; `adapter.ts` the
  mongo storage of provider models.
- Tokens are signed with the **scoped** key set (the one behind
  `/.well-known/scoped-jwks.json`), never with the session keys.

## Issuer sites and realm

The issuer of a request is derived from its site (`issuerOfSite`):

| Request site | Issuer |
| --- | --- |
| main site | `config.publicUrl` |
| an account main site (`isAccountMain`), or a standalone `onlyLocal` site whose owner has no designated main site | `<site url>/simple-directory` |
| anything else | no issuer: 404 |

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
same token shape.

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
| `oauthServer.enabled` | Master switch: everything under `/api/oauth/` and the discovery documents is 404 when off. |
| `oauthServer.authorizationCode` | The authorization code flow (M2). Off: `/api/oauth/authorize` is 404 and discovery drops the authorization endpoint and the code, implicit and refresh grants. |
| `oauthServer.dynamicClients` | Dynamic client registration (M2). Off. |
| `mcpPath` | Path segment marking an MCP resource. |
| `manageNhis` | Both machine grants. Off: discovery advertises neither `client_credentials` nor the JWT bearer grant. |

Discovery advertises only what is served: endpoints that are not routed
(userinfo, introspection, registration, PAR, logout) are disabled in the
provider configuration, and `grant_types_supported` is filtered by the flags
above. `jwks_uri` points to the scoped key set. Internal requests (no site
context) get 404 on all of it.

## Invariants

1. **No cookies from OAuth.** The token endpoint never sets a session cookie
   and never creates a server session; the output is a bearer token only.
2. **No superadmin claims.** `isAdmin`, `adminMode` and `asAdmin` are removed
   in `sdClaims` and again in the provider customizer, whatever the user is.
3. **An MCP audience means an NHI subject.** In M1 only NHIs get tokens, and
   they are the only subjects an MCP token can name.
4. **Realm confinement.** A resource must belong to the realm of the issuer,
   and an issuer site is its own account main site.
5. **The NHI site rule.** An NHI is only issued a token for the main site or a
   site owned by its own organization, in both grants, as in `/nhi-token`.
6. **One exchange.** Rate limiting, `allowedIps`, assertion verification and the
   `exp` cap are those of `nhis/exchange.ts`, not reimplemented per grant.
7. **Only what is served is advertised.** Discovery follows the flags.

## Known accepted surfaces

- JWT access tokens cannot be revoked individually; the 30 minute lifetime is
  the bound (disabling the NHI stops renewals).
- The rate limiter is keyed on a `client_id` that is not verified at that point,
  so a caller can drain an NHI's bucket from many IPs. Pre-existing with
  `/nhi-token`.
- The JWT bearer grant has no assertion replay store (as `/nhi-token`, see
  `non-human-identities.md`); `client_credentials` assertions are
  replay-protected by the provider.

## Dependency on the lib

Services accept these tokens through `@data-fair/lib-express`. Its bearer
audience check -- `aud` must contain the request's site URL, and an internal
request without `x-forwarded-host` is refused -- is released separately in the
lib; services upgrade it only after this server is deployed.
