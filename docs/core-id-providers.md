# Core identity providers

Reference for the `coreIdProvider` flag on auth providers: what it means, how
it is enforced server-side, and what an account bound to one looks like.
Required reading before changing anything in `authProviderLoginCallback`,
`patchCoreAuthUser`, `/keepalive`, the `idp` JWT claim, or the user PATCH
allow-list. See also
[`architecture/email-trust-and-site-isolation.md`](architecture/email-trust-and-site-isolation.md)
for the orthogonal admin / cross-site trust model.

## Concept

A *core identity provider* is an auth provider declared the **authoritative
source of identity** for the accounts it creates. Setting
`coreIdProvider: true` on a provider config promotes that provider from "one
of several login methods" to "the only login method", and binds a user
record's profile to whatever the provider returns on each refresh.

Once an account is bound:

- It is pinned to one `{ type, id }` provider tuple. Password, passwordless
  and other-provider login attempts return 403.
- Profile fields are rewritten from the provider on each login *and* each
  session refresh; local edits to those fields are rejected.
- The session is a liveness probe — if the provider's refresh-token
  exchange fails, the session is destroyed.
- Org membership tied to the provider is read-only when the provider also
  configures a role or department mapping.

`coreIdProvider` is a superadmin-level decision, set in the site config UI
or in the deployment-level `config.oidc.providers` /
`config.oauth.providers` entries.

## Configuration

The flag is declared in `api/types/site/schema.js` as a shared `$def`:

- Field shape: `coreIdProvider: { type: 'boolean' }` — `api/types/site/schema.js:1278`.
- Wired into the SAML2 provider config at `api/types/site/schema.js:553` and
  the OIDC provider config at `api/types/site/schema.js:861`.
- Applies identically to root-level providers — `config.oidc.providers[]`
  and `config.oauth.providers[]` entries support the same flag (see
  `api/config/development.cjs` for examples).

The schema's English `description` documents three effects to operators:

1. an account associated with this provider cannot have any other
   authentication method (no password, no other provider);
2. account information is read-only and synchronized from the provider
   while the user has an active session;
3. when `memberRole` is set, the role is also synchronized and cannot be
   edited from the back office.

## Data model

### On the user record

`api/types/user/schema.js:117`:

```js
coreIdProvider: {
  type: 'object',
  required: ['type', 'id'],
  properties: { type: { type: 'string' }, id: { type: 'string' } }
}
```

A user with `coreIdProvider` set is bound to one provider. The provider's
auth payload is also written under `user[provider.type][provider.id]` (e.g.
`user.oidc['localhost8999']`) with a `coreId: true` marker on that nested
record.

### On the JWT

`api/src/tokens/service.ts:48`:

```ts
if (user.coreIdProvider) payload.idp = 1
```

All downstream guards key off the session-level `idp` flag rather than
re-reading the user record.

## Lifecycle

### First login through a core provider

`authProviderLoginCallback` in `api/src/auth/service.ts:119` handles all
SSO callbacks. When the matched email has no existing user, it creates one:

```ts
// api/src/auth/service.ts:186
const newUser: UserWritable = {
  ...authInfo.user,
  id: nanoid(),
  emailConfirmed: true,
  [provider.type]: {
    [provider.id]: { ...authInfo, coreId: provider.coreIdProvider ? true : undefined }
  },
  coreIdProvider: provider.coreIdProvider ? { type: provider.type, id: provider.id } : undefined,
  organizations: []
}
```

For OAuth / OIDC core providers the OAuth callback also persists the
offline refresh token so the keepalive path can refresh the session later
(`api/src/auth/router.ts:766`):

```ts
const [callbackUrl, user] = await authProviderLoginCallback(...)
if (provider.coreIdProvider) {
  const callbackSite = await reqSite(req)
  await writeOAuthToken(user, provider, token, offlineRefreshToken, undefined, callbackSite?._id)
}
```

### Subsequent login conflict guard

`api/src/auth/service.ts:224`:

```ts
if (user.coreIdProvider && (user.coreIdProvider.type !== (provider.type || 'oauth')
                            || user.coreIdProvider.id !== provider.id)) {
  throw httpError(400, 'Utilisateur déjà lié à un autre fournisseur d\'identité principale')
}
```

A user already bound to one core provider cannot be authenticated by a
different provider, even if both expose the same email. Operator config
changes that would re-bind an account require manual intervention.

### Patching the user from provider claims

`patchCoreAuthUser` (`api/src/auth/service.ts:273`) is the one place that
reconciles a user record with a provider response, on both interactive
login and keepalive refresh.

```ts
// api/src/auth/service.ts:285
if (provider.coreIdProvider) {
  Object.assign(patch, authInfo.user)
  for (const memberInfo of memberInfos) {
    if (memberInfo.readOnly) {
      await storages.globalStorage.addMember(memberInfo.org, user, memberInfo.role,
                                             memberInfo.department, memberInfo.readOnly)
      await setNbMembersLimit(memberInfo.org.id)
    }
  }
} else {
  if (authInfo.user.firstName && !user.firstName) patch.firstName = authInfo.user.firstName
  if (authInfo.user.lastName && !user.lastName) patch.lastName = authInfo.user.lastName
}
```

Core providers replace the entire identity surface (`Object.assign(patch,
authInfo.user)`); non-core providers only fill missing first / last name.
Read-only memberships are re-applied on every sync.

### Keepalive refresh

`POST /api/auth/keepalive` (`api/src/auth/router.ts:473`) handles session
prolongation. For users bound to an OAuth or OIDC core provider it does
*not* trust the existing session — it forces a token refresh and a profile
re-sync:

```ts
// api/src/auth/router.ts:485
// in coreIdProvider mode always refresh the token on keepalive to ensure that we are synced
// with the provider (user exists, has role, etc)
const coreIdProvider = user.coreIdProvider
if (coreIdProvider?.type === 'oauth' || coreIdProvider?.type === 'oidc') {
  // ... resolve provider (global, site-bound, or onlyOtherSite sibling)
  const oauthToken = (await readOAuthToken(user, provider, authSite?._id))
  if (!oauthToken)         { await logout(req, res); return res.status(401).send(...) }
  if (oauthToken.loggedOut) { await logout(req, res); return res.status(401).send(...) }
  const refreshedToken = await provider.refreshToken(oauthToken.token)
  if (refreshedToken) {
    const userInfo = await provider.userInfo(newToken.access_token, newToken.id_token, { req })
    const memberInfos = await authProviderMemberInfo(await reqSite(req), provider, userInfo)
    user = await patchCoreAuthUser(provider, user, userInfo, memberInfos)
    await writeOAuthToken(user, provider, newToken, offlineRefreshToken, undefined, authSite?._id)
  }
}
```

Provider resolution depends on the request context:

- back-office (`!site.authMode` or `onlyBackOffice`) → match against
  `oauthGlobalProviders()` (root-level `config.oidc.providers`);
- standalone site → match against `site.authProviders`;
- `onlyOtherSite` site → resolve to the sibling `authOnlyOtherSite` and
  match its `authProviders`.

Failure modes (each forces a 401 + `logout`):

- the provider is no longer exposed by the resolved site
  (`sd.auth.keepalive.no-provider`);
- no stored OAuth token for the user on the resolved site
  (`sd.auth.keepalive.no-token`);
- the stored token is flagged `loggedOut` by an `/oauth-logout` back-channel
  notification (`sd.auth.keepalive.logged-out`);
- `refreshToken()` throws (`sd.auth.keepalive.oauth-refresh-ko`).

The keepalive refresh path covers `oauth` and `oidc` core providers. SAML2
core providers are synchronised at interactive login only; the keepalive
branch above is gated on the OAuth/OIDC types.

## Restrictions on a core-id user

The `payload.idp` flag is checked by route guards on every mutating
self-service endpoint.

### Auth surface

`api/src/auth/router.ts:43` defines a single middleware:

```ts
const rejectCoreIdUser: RequestHandler = (req, res, next) => {
  if (reqUser(req)?.idp) throw httpError(403, 'This route is not available for users with a core identity provider')
  next()
}
```

Applied to:

- `POST /auth/password` — password login;
- `POST /auth/passwordless` — magic-link login;
- `POST /auth/:userId/password` — self-service password change;
- `POST /auth/:userId/host` — change-host flow.

### Profile patch

`api/src/users/router.ts:17` defines an equivalent middleware, and
`PATCH /users/:userId` (`api/src/users/router.ts:260`) restricts the
allow-list:

```ts
// api/src/users/router.ts:259
const coreIDPKeys = ['defaultOrg', 'defaultDep', 'ignorePersonalAccount', 'plannedDeletion']

if (session.user?.idp && Object.keys(req.body).find(key => !coreIDPKeys.includes(key))) {
  throw httpError(403, 'Invalid patch for user with a core identity provider')
}
```

A core-id user can change their default org / department, opt out of the
personal account, and request scheduled deletion. All other fields
(`firstName`, `lastName`, `birthday`, `email`, …) are managed by the
provider.

### UI

`ui/src/pages/me.vue:328` flips the personal-info form to read-only when
`user.idp` is set, and `:392` strips first / last name and birthday from
the PATCH body before sending it.

## Member role and department auto-sync

`authProviderMemberInfo` (`api/src/auth/service.ts:44`) computes the
membership(s) a provider should create or refresh on each callback. When a
provider is core *and* configures a non-`none` `memberRole` or
`memberDepartment`, the resulting membership is read-only:

```ts
// api/src/auth/service.ts:66
if (provider.coreIdProvider && ((provider.memberRole && provider.memberRole?.type !== 'none')
                                || (provider.memberDepartment && provider.memberDepartment?.type !== 'none'))) {
  readOnly = true
}
```

Resolution rules for each mapping (full code at `api/src/auth/service.ts:71-111`):

- `static` — the configured role / department is applied verbatim;
- `attribute` — value comes from the IdP claim named in
  `provider.memberRole.attribute` or `memberDepartment.attribute`. For role
  there is an optional `values` mapping table and a `defaultRole` fallback;
  for department there is `orgRootValue` (a sentinel that means "no
  department") and a `required` flag;
- otherwise role defaults to `'user'`.

`patchCoreAuthUser` re-applies these read-only memberships on every login
and on every keepalive refresh.

## Security boundaries

`coreIdProvider` is independent from the cross-site / superadmin trust
model documented in
[`architecture/email-trust-and-site-isolation.md`](architecture/email-trust-and-site-isolation.md).
The relevant invariants from that doc continue to hold for core providers:

- Standard OAuth providers (`provider.type === 'oauth'`, e.g.
  github / google / facebook / linkedin from `config.oauth.providers`)
  cannot authenticate a superadmin, regardless of `coreIdProvider`
  (`api/src/auth/service.ts:159`).
- Site-level core providers cannot escalate to superadmin: user records
  created from a site-level provider carry `host`, and `isAdmin` requires
  `!host`.
- Email-verification rules are unchanged. The OIDC `ignoreEmailVerified`
  escape hatch is orthogonal and remains a superadmin-level decision per
  provider.
- `adminMode=1` activation rejects on any non-main-site session, including
  core-id sessions.

## Tests

End-to-end coverage lives in two Playwright API specs:

- `tests/features/oidc-core-id.api.spec.ts` — global OIDC core provider
  (configured on `MOCK_OIDC_PORT2` in `api/config/development.cjs`).
  Walks the full OIDC dance, asserts session cookies are issued, then
  mutates the mock provider's `userinfo` and asserts that a `keepalive`
  call refreshes the token, re-syncs the profile, and propagates the
  changes back to the session.
- `tests/features/oidc-core-id-cross-site.api.spec.ts` — site-level core
  provider on an `isAccountMain` site, exercised through an `onlyOtherSite`
  sibling. Verifies the keepalive path resolves the backing site's
  providers correctly when the request lands on the sibling.
