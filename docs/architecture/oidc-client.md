# OIDC client

How Simple Directory acts as a relying party of an OpenID Connect provider (and, for the parts they share, of
an OAuth 2 or SAML 2 one): the login flow, what is verified, what a provider flag changes, how the login is
handed over to the server session and how logout works in both directions. The trust placed in the claims
themselves (email verification, site isolation) is in
[`email-trust-and-site-isolation.md`](email-trust-and-site-isolation.md), the session side in
[`session-theft-protections.md`](session-theft-protections.md).

Code: `api/src/oauth/oidc.ts` (provider, discovery, userinfo, policy), `api/src/oauth/oidc-jwt.ts` (JWT
verification, JWKS cache), `api/src/oauth/service.ts` (authorization URI, token request),
`api/src/auth/login-binding.ts`, and in `api/src/auth/router.ts` `oauthLogin`, `oauthCallback`,
`token_callback`, `oauthLogoutCallback`, `DELETE /`, `oidc-logout-callback`, `saml2/:providerId/login` and
`saml2-assert`.

## Login flow

1. `oauthLogin` creates a relay state (random id, also the OAuth `state`) holding the redirect, the target
   org/department, the invitation token, `adminMode`, a `nonce` (OIDC only) and a PKCE `codeVerifier`. The
   authorization request carries the `S256` challenge (every provider, standard OAuth ones included).
2. It also sets the binding cookie (below) and redirects to the provider.
3. `oauthCallback`: loads the relay state, **checks the binding cookie, then** consumes the relay state with an
   atomic `usedAt` update (single use), handles a provider `error`, checks the RFC 9207 `iss` response
   parameter, exchanges the code (with the `code_verifier`), validates the id_token (`validateIdToken`, with the
   `nonce`), reads the claims (`userInfo`) and calls `authProviderLoginCallback`.
4. The login ends on `token_callback` (below), which creates the server session.

### Browser binding

`setLoginBinding` stores a random secret in the cookie `sd_login_<relayStateId>` (httpOnly, 30 minutes, path
`<site path>/simple-directory/api/auth/`) and only its SHA-256 in the relay state. `checkLoginBinding` compares
in constant time and always clears the cookie. A callback URL replayed from another browser (login CSRF,
session fixation) has no cookie and is refused. The check runs **before** the relay state is consumed: someone
who learned the `state` from the authorize URL cannot burn the login of the browser that started it.

The OIDC cookie is `SameSite=Lax` (the callback is a top level GET). SAML uses the same binding, but the ACS
(`saml2-assert`) is a cross-site POST: the cookie is `SameSite=None; Secure` when `publicUrl` is https, `Lax`
otherwise, and on plain http a cross-site IdP POST loses the cookie (dev only).

## What is verified

`verifyProviderJwt` (`oidc-jwt.ts`) is the single verification routine for id_tokens, signed userinfo and
logout tokens, with a 60 second clock tolerance. Failures are `OidcValidationError` with a `check`:

- `signature`: asymmetric algorithms against the provider JWKS, `HS*` against the client secret. A JWKS that
  cannot be fetched is also reported as `signature` (the message tells the outage from a bad signature).
- `alg` (unknown or `none`), `malformed`, `exp` (required for id_tokens), `iat` (not in the future),
  `iss` (must equal the discovery issuer; Entra's `{tenantid}` template is expanded with the `tid` claim),
  `aud` (must contain the client id), `azp` (must equal the client id when there are several audiences),
  `nonce` (id_token only).
- Around it in `oauthCallback`/`userInfo`: a missing id_token in the token response, the RFC 9207 `iss`
  parameter (mismatch with the issuer, or absent while the discovery announces
  `authorization_response_iss_parameter_supported`), the signature of an `application/jwt` userinfo, and the
  `sub` binding: whatever source the claims come from (userinfo, access token...) their `sub` must equal the
  one of the verified id_token.
- Logout tokens: see Back-channel logout.

### Strict or alert

`strict = p.strict ?? !trusted` (`completeOidcProvider`). Providers of a site are untrusted: absent means
strict. Providers of the root config (`config.oidc.providers`) are trusted: absent means non-strict. The site
form (`api/doc/sites/patch-req-body/schema.js`) shows and initialises `strict` and `rpInitiatedLogout` as checked
for a site provider through a form only default (`layout.defaultData`, not a schema `default`: the root config
`$ref`s the same `oidcProvider` definition and must keep absent as false). The
`upgrade/8.23.1/oidc-providers-legacy-flags.ts` script sets `strict: false` (and `rpInitiatedLogout: false`) on
every existing site OIDC provider, so existing sites keep today's behaviour until an admin opts in.

`applyOidcPolicy` is the single place of the policy:

- strict: the error is rethrown, the callback refuses with `badIDPResponse` (logout tokens: HTTP 400) and logs
  `log.warn` `sd.auth.oauth.fail` with the `check`;
- non-strict: `log.alert` `sd.oidc.validation-failed` `{ providerId, check }`, then the unverified decoded
  claims are used as before. The alert is only emitted for interactive logins (when log fields are passed):
  the keepalive of a core id provider session validates the refreshed id_token without log fields, so a
  failing non-strict provider does not raise an alert at each keepalive (a strict one still refuses, which
  ends the session).

Never turn a new check into an unconditional refusal: add it to this policy so that non-strict providers only
alert.

### Non-strict mode is transitional

Non-strict mode exists only to let existing deployments upgrade without breaking logins. A future major
release will make strict validation always on: the `strict` flag will be ignored then removed,
`applyOidcPolicy` will always refuse, and root config providers will be strict too.

Until then, operators must monitor the `sd.oidc.validation-failed` alerts. Each one names the provider and
the failed `check`. Fix the cause (provider configuration, client id, issuer, keys...), then set
`strict: true` on that provider. Before the release that removes the flag, check that no
`sd.oidc.validation-failed` alert was emitted for several weeks and that every provider runs strict, and
announce the change as breaking in the release notes.

### Unconditional protections

Not behind `strict`: the binding cookie, single use relay states, PKCE `S256`, the nonce for OIDC, the
single use of redirect flow callback tokens, `token_callback` accepting only temporary tokens.

## Discovery and JWKS

- Discovery documents are cached in `mongo.oidcDiscovery` (key: the slugified discovery URL), refreshed after
  24 hours. If the refresh fails the stale copy is kept and a warning logged: a provider outage must not break
  logins. The failure stores a `retryAfter` date (`DISCOVERY_RETRY_DELAY`, 1 minute) in the cache document,
  so that every process serves the stale copy without refetching until then: providers are initialised on
  every callback and keepalive, one unreachable provider must not add a fetch to each of them.
- JWKS are cached in memory for 1 hour per `jwks_uri`. An unknown `kid` triggers one forced refetch at most
  per minute (key rotation); concurrent fetches of a URI are shared (in-flight dedup); on refresh failure the
  stale keys are served and the next attempt is delayed.
- Untrusted (site) providers fetch discovery, JWKS and userinfo through the SSRF-filtered public agents
  (`axiosInstance`); only root config providers use `privateAxiosInstance`. Never use `fetch` or jose's
  `createRemoteJWKSet` here.

## Client authentication and claims

- When `authorizationMethod` is not set it is chosen from the discovery
  (`token_endpoint_auth_methods_supported`): `client_secret_post` announced without `client_secret_basic` means
  credentials in the body, otherwise the `Authorization` header.
- `scope` defaults to `openid email profile`.
- The userinfo endpoint may answer JSON or a JWT (`application/jwt`), verified like an id_token without
  `exp`. If it yields no email the id_token then the access token claims are used.
- `family_name` is the last name, `usual_name` (ProConnect) is used when it is absent.

## Handoff to the server session

For redirect flows the callback URL goes through `prepareCallbackUrl`, which signs a temporary token carrying a
`cbJti`, and `token_callback` (possibly on another domain, for secondary sites) turns it into a server session.
`token_callback` accepts only tokens with `temporary: true` and no `action`; it records the `cbJti` in
`mongo.usedCallbackTokens` (TTL on the token's own expiry) and refuses a second use (`sd.auth.callback.reuse`).
See [`session-theft-protections.md`](session-theft-protections.md). Emailed links (passwordless login, account
confirmation, unconfirmed account resend) carry no `cbJti` and stay reusable until expiry, because mail
scanners prefetch links.

## Logout

Invariant the logout scoping relies on: root (config) providers are reachable only on requests without a site,
and site providers only on requests with one (`getOAuthProviderById` / `getOAuthProviderByState`). A login
through a root provider therefore never records a site (`idp.site` absent, oauth token `site: null`), and a
login through a site provider always does. RP-initiated and back-channel logout match on that level.

### RP-initiated logout

Flag `rpInitiatedLogout`, same rules as `strict` (`p.rpInitiatedLogout ?? !trusted`, migrated to `false` for
existing site providers). It also needs an `end_session_endpoint` in the discovery.

- At login, the id_token waits on the relay state (`idToken`, `idpProviderId`, `idpSite`). `token_callback`
  moves it (atomic find and unset) to `idp` on the server session. See
  [`session-theft-protections.md`](session-theft-protections.md). The storages keep it (`logout` reads it
  back) but it never leaves the API: every response built from a storage user goes through `exposedUser`
  (`api/src/users/expose.ts`), which drops `sessions[].idp`.
- `DELETE /api/auth` calls `logout(req, res, { endSession: true })` and answers `200 { endSessionUrl }` when the
  session has an `idp`; lib-vue then redirects the browser. Without it, or when asked without `endSession`
  (other callers of `logout`), the answer is a plain `204` logout.
- `idpEndSessionUrl` resolves the provider at the level recorded in `idp.site`: with it set, only that site's
  `authProviders`; without it, only the root providers. There is no fallback between levels. It builds `end_session_endpoint?id_token_hint&client_id&post_logout_redirect_uri&state`.
  Any failure (site or provider gone, flag turned off) is logged (`sd.auth.oidc.end-session-fail`) and the
  logout carries on without the URL.
- The post logout redirect URI to register at the provider is
  `<site base URL or publicUrl>/simple-directory/api/auth/oidc-logout-callback`, which redirects to the site
  root.

### Back-channel logout

`/api/auth/oauth-logout` (GET or POST, `logout_token` in the body).

1. The provider is found from the **unverified** `iss`: providers of the current site first (matched on the
   issuer of their cached discovery; only the match is initialised, a broken provider is logged and skipped),
   then root providers. So for an issuer declared at both levels the site's policy applies.
2. `validateLogoutToken` verifies the token (signature, `iss`, `aud`, `azp`), requires `iat` (not older than
   10 minutes, no `jti` store: replay is only possible in that window), the
   `http://schemas.openid.net/event/backchannel-logout` entry in `events`, no `nonce`, and a `sid` or a `sub`.
   A non-strict provider that fails still honours the legacy unsigned Keycloak shape (`typ: Logout` and `sid`),
   after the alert.
3. `logoutOAuthToken` flags the OAuth tokens of that provider id **and** level (site id, `null` for a root
   provider), by `sid` (or the legacy `session_state`), else by `sub`. Both are stored on the oauth token at
   login, from the verified id_token claims, and kept at keepalive when a refreshed id_token omits them.

OAuth tokens are only stored for logins through a provider with `coreIdProvider`, and only the keepalive of a
core id user checks the `loggedOut` flag: back-channel logout ends nothing for the other providers (the
request is still answered `204`).

Every refusal (missing or undecodable token, unknown issuer, failed verification) is answered with the same
`400 invalid logout_token`; the reason is only logged, for a failed verification (`sd.auth.oauth.fail`).

## Configuring ProConnect

Site provider of type `oidc`, discovery URL of the ProConnect environment (`.../.well-known/openid-configuration`),
client id and secret, and `scope: "openid email given_name usual_name"`. Nothing else is required: the client
authentication method comes from the discovery, the `application/jwt` userinfo and `usual_name` are handled,
the nonce is always sent. Register at ProConnect the callback `<base>/simple-directory/api/auth/oauth-callback`
and, for RP-initiated logout, the post logout URI above. `strict` and `rpInitiatedLogout` are on for a new
site provider (absent means on, the form shows them checked); on a provider migrated from before them
(set to `false` by the upgrade script) check them both.

ProConnect is usually not a core id provider (`coreIdProvider` off: the users keep their own accounts). Its
back-channel logout then ends nothing on the SD side (see Back-channel logout), so there is no need to register
`<base>/simple-directory/api/auth/oauth-logout`; it only matters for a core id provider.

## Known limits

- Login CSRF through the `token_callback` hop remains possible by design: the temporary token is a bearer
  value that must work in a browser on another domain (secondary sites), so it cannot be bound to the browser
  that started the login. Single use only limits the replay.
- Emailed callback links stay reusable until they expire.
- Logout tokens have no `jti` store: replayable for 10 minutes (the effect is a logout).
- Existing site providers are migrated to non-strict: the protections above only alert for them until an admin
  enables `strict`.
- SAML on plain http loses the binding cookie on the cross-site ACS POST.
- Back-channel logout only flags the OAuth tokens (`loggedOut`); the SD session ends at its next keepalive, which
  finds the flag, not immediately.
- Back-channel logout only acts on logins through a core id provider (the only ones with a stored OAuth token
  and a keepalive that checks it). For any other provider (ProConnect as usually configured included) a logout
  at the provider leaves the SD session alive until it expires or the user logs out.
