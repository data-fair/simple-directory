# Superadmin Session Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `adminMode` (superadmin) sessions: fresh TOTP at every adminMode login, hard 12h session expiry, `ForceAuthn` on SAML adminMode logins, and an in-login prompt that replaces the double login.

**Architecture:** All changes follow the spec in `docs/superpowers/specs/2026-06-12-superadmin-session-hardening-design.md`. The 2FA rule is one condition change in the password route. The hard expiry is implemented in the single cookie chokepoint `setSessionCookies` by signing the exchange token with a new `jwtDurations.adminExchangeToken` and preserving the original `exp` on renewals. SAML ForceAuthn uses samlify's custom `loginRequestTemplate` + `customTagReplacement` path, activated per-request. The in-login prompt is a stateless `{ step: 'adminMode' }` API response gated on a new `offerAdminMode` body flag sent only by the SD login page.

**Tech Stack:** Node.js/Express 5/TypeScript API, Vue 3 + Vuetify UI, Playwright tests, samlify, otplib, jsonwebtoken.

**Conventions for this repo:**
- The dev environment (API server, mongo, nginx…) is managed by the user through zellij. **Never start/stop dev processes.** API tests (`.api.spec.ts`) hit the running dev server. If an API test fails unexpectedly, check `dev/logs/dev-api.log`.
- Run a single test file with: `npm run test-base tests/features/<file>.ts`
- Lint: `npm run lint` — Types: `npm run check-types` — Schema/type regeneration: `npm run build-types`
- The git pre-push hook runs the full suite; during tasks only run the related files.

---

### Task 1: Fresh TOTP on every adminMode login

The 30-day `id_token_2fa_<userId>` cookie must no longer satisfy the 2FA requirement when the login carries `adminMode`.

**Files:**
- Modify: `api/src/auth/router.ts:216`
- Create: `tests/features/admin-sessions.api.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/admin-sessions.api.spec.ts`:

```ts
import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { authenticator } from 'otplib'
import { axiosAuth, axios, testEnvAx } from '../support/axios.ts'
import type { AxiosAuthInstance } from '@data-fair/lib-node/axios-auth.js'

// configure TOTP 2FA for a user through the /api/2fa endpoints, returns the TOTP secret
const setup2FA = async (email: string, password = 'TestPasswd01') => {
  const anonymAx = axios()
  const initRes = await anonymAx.post('/api/2fa', { email, password })
  const secret = new URL(initRes.data.otpauth).searchParams.get('secret')
  assert.ok(secret)
  await anonymAx.post('/api/2fa', { email, password, token: authenticator.generate(secret) })
  return secret
}

// password login with an arbitrary body (2fa code, adminMode...) reusing the cookie jar of ax
const passwordLoginFull = async (ax: AxiosAuthInstance, body: Record<string, any>) => {
  const res = await ax.post('/api/auth/password', body)
  try {
    await ax.get(res.data, { maxRedirects: 0 })
  } catch (err: any) {
    if (err.status !== 302) throw err
    const redirectError = new URL(err.headers.location).searchParams.get('error')
    if (redirectError) throw new Error(redirectError)
  }
  return res
}

test.describe('Superadmin session hardening', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('adminMode login ignores the 2FA session cookie', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com' }) as AxiosAuthInstance
    const secret = await setup2FA('admin@test.com')

    // a normal login with a TOTP code sets the 2FA session cookie
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', '2fa': authenticator.generate(secret) })
    // thanks to the cookie a normal login no longer needs the TOTP code
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01' })

    // an adminMode login refuses the cookie shortcut
    await assert.rejects(
      ax.post('/api/auth/password', { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true }),
      (err: any) => err.status === 403 && err.data === '2fa-required'
    )

    // an adminMode login with a fresh TOTP code succeeds
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true, '2fa': authenticator.generate(secret) })
    const me = (await ax.get('/api/auth/me')).data
    assert.ok(me.adminMode)
  })
})
```

Note: `otplib` is an api-workspace dependency hoisted to the root `node_modules` — the import works from tests. If TypeScript complains about the import, check `node_modules/otplib` exists.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: FAIL on the `assert.rejects` — the adminMode login with the cookie currently succeeds (no rejection).

- [ ] **Step 3: Implement the condition change**

In `api/src/auth/router.ts`, the 2FA block currently reads (line ~215):

```ts
  if ((user2FA && user2FA.active) || await storage.required2FA(user)) {
    if (await check2FASession(req, user.id)) {
      // 2FA was already validated earlier and present in a cookie
```

Change the inner condition to:

```ts
  if ((user2FA && user2FA.active) || await storage.required2FA(user)) {
    if (!body.adminMode && await check2FASession(req, user.id)) {
      // 2FA was already validated earlier and present in a cookie.
      // Entering adminMode always requires a fresh TOTP: the long-lived cookie must not
      // weaken the superadmin re-authentication (see docs/architecture/email-trust-and-site-isolation.md)
```

Nothing else changes: on a successful fresh TOTP the cookie is still written (the `body['2fa']` branch), and recovery/bad-token paths are untouched.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/features/admin-sessions.api.spec.ts api/src/auth/router.ts
git commit -m "feat(auth): require a fresh TOTP for every adminMode login"
```

---

### Task 2: Config key `jwtDurations.adminExchangeToken`

Plumb the new duration through default config, env var, JSON schema, generated types, and the parsed `jwtDurations` export.

**Files:**
- Modify: `api/config/default.cjs:13-20`
- Modify: `api/config/custom-environment-variables.cjs` (jwtDurations block)
- Modify: `api/config/type/schema.json:272-296` (jwtDurations required + properties)
- Modify: `api/src/config.ts:64-67`
- Modify: `api/types/index.ts:79-83`
- Generated: `api/config/type/.type/*` (via `npm run build-types`)

- [ ] **Step 1: Add the key to `api/config/default.cjs`**

```js
  jwtDurations: {
    initialToken: '15m',
    exchangeToken: '30d',
    // hard expiry of adminMode sessions: their exchange token is not renewable (see tokens/service.ts)
    adminExchangeToken: '12h',
    idToken: '15m',
    invitationToken: '10d',
    partnerInvitationToken: '10d',
    '2FAToken': '30d'
  },
```

- [ ] **Step 2: Add the env var to `api/config/custom-environment-variables.cjs`**

```js
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    idToken: 'JWT_DURATION_ID',
    exchangeToken: 'JWT_DURATION_EXCHANGE',
    adminExchangeToken: 'JWT_DURATION_ADMIN_EXCHANGE',
    invitationToken: 'JWT_DURATION_INVIT',
    partnerInvitationToken: 'JWT_DURATION_PARTNER_INVIT',
    '2FAToken': 'JWT_DURATION_2FA'
  },
```

- [ ] **Step 3: Add the property to `api/config/type/schema.json`**

In the `jwtDurations` definition (~line 272), add `"adminExchangeToken"` to the `required` array (after `"exchangeToken"`) and add the property after the `"exchangeToken"` property line:

```json
        "adminExchangeToken": { "type": "string" },
```

- [ ] **Step 4: Regenerate types**

Run: `npm run build-types`
Expected: exits 0, regenerates `api/config/type/.type/*` (and `ui/src/components/vjsf/*`).

- [ ] **Step 5: Extend the parsed `jwtDurations` export in `api/src/config.ts`**

```ts
export const jwtDurations = {
  idToken: ms(apiConfig.jwtDurations.idToken) / 1000,
  exchangeToken: ms(apiConfig.jwtDurations.exchangeToken) / 1000,
  adminExchangeToken: ms(apiConfig.jwtDurations.adminExchangeToken) / 1000
}
```

- [ ] **Step 6: Add `exp` to `SessionInfoPayload` in `api/types/index.ts`**

`session.verifyToken` returns the decoded JWT including `exp`; Task 3 needs to read it.

```ts
export type SessionInfoPayload = {
  session: string
  user: string
  adminMode?: 1
  // exp is set by jwt signing; present when the payload comes from a decoded token
  exp?: number
}
```

- [ ] **Step 7: Type-check and commit**

Run: `npm run check-types`
Expected: exits 0.

```bash
git add api/config/default.cjs api/config/custom-environment-variables.cjs api/config/type/ api/src/config.ts api/types/index.ts ui/src/components/vjsf
git commit -m "feat(config): add jwtDurations.adminExchangeToken (default 12h)"
```

(If `npm run build-types` touched other generated files, include them.)

---

### Task 3: Hard expiry for adminMode sessions in `setSessionCookies`

adminMode exchange tokens are signed with `adminExchangeToken` and renewals keep the original `exp` (absolute cap). Normal sessions keep the rolling 30d window.

**Files:**
- Modify: `api/src/tokens/service.ts:114-172` (`setSessionCookies`)
- Test: `tests/features/admin-sessions.api.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/features/admin-sessions.api.spec.ts`, inside the same `test.describe`, plus this helper above the describe block:

```ts
// extract and decode the id_token_ex JWT payload from a response's set-cookie headers
const readExchangeCookie = (res: any) => {
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  const exCookie = setCookies.find((c: string) => c.startsWith('id_token_ex='))
  assert.ok(exCookie, 'missing id_token_ex set-cookie header')
  const tokenValue = exCookie.match(/^id_token_ex=([^;]+)/)![1]
  return JSON.parse(Buffer.from(tokenValue.split('.')[1], 'base64url').toString())
}
```

```ts
  test('adminMode session has a short exchange token that keepalive does not extend', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    let res = await ax.post('/api/auth/keepalive')
    const now = Math.floor(Date.now() / 1000)
    const payload1 = readExchangeCookie(res)
    assert.equal(payload1.adminMode, 1)
    // 12h default duration, not the 30d of normal sessions
    assert.ok(payload1.exp < now + 13 * 3600, `exp too far: ${payload1.exp - now}s`)
    assert.ok(payload1.exp > now + 11 * 3600, `exp too close: ${payload1.exp - now}s`)
    // a second keepalive does NOT extend the expiry (absolute cap)
    await new Promise(resolve => setTimeout(resolve, 1500))
    res = await ax.post('/api/auth/keepalive')
    const payload2 = readExchangeCookie(res)
    assert.equal(payload2.exp, payload1.exp)
  })

  test('normal session keeps the long rolling exchange token', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com' })
    let res = await ax.post('/api/auth/keepalive')
    const now = Math.floor(Date.now() / 1000)
    const payload1 = readExchangeCookie(res)
    assert.ok(!payload1.adminMode)
    assert.ok(payload1.exp > now + 29 * 24 * 3600)
    // keepalive extends the rolling window
    await new Promise(resolve => setTimeout(resolve, 1500))
    res = await ax.post('/api/auth/keepalive')
    const payload2 = readExchangeCookie(res)
    assert.ok(payload2.exp >= payload1.exp + 1)
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: the adminMode test FAILS (`exp too far` — currently 30d), the normal-session test PASSES (current behavior).

- [ ] **Step 3: Restructure `setSessionCookies`**

In `api/src/tokens/service.ts`, replace the whole `setSessionCookies` function (lines 114-172) with the version below. The change moves the existing-exchange-token decoding and `sessionInfo` construction **before** the expiry computation, then picks the exchange expiry based on `sessionInfo.adminMode`. Everything else (cookie names, options, deprecated-session cleanup) is identical.

```ts
// Split JWT strategy, the signature is in a httpOnly cookie for XSS prevention
// the header and payload are not httpOnly to be readable by client
// all cookies use sameSite for CSRF prevention
export const setSessionCookies = async (req: Request, res: Response, sitePath: string, payload: SessionUser, serverSessionId: string | null, userOrg?: OrganizationMembership, options?: { skipExchangeToken?: boolean }) => {
  const cookies = new Cookies(req, res, { secure })
  // cf https://www.npmjs.com/package/jsonwebtoken#token-expiration-exp-claim
  const date = Date.now()
  const exp = Math.floor(date / 1000) + jwtDurations.idToken

  const existingExchangeToken = cookies.get('id_token_ex')
  let existingServerSessionInfo: SessionInfoPayload | undefined
  if (existingExchangeToken) {
    try {
      existingServerSessionInfo = (await session.verifyToken(existingExchangeToken)) as SessionInfoPayload | undefined
    } catch (err) {
      // ignore an old invalid exchange token
    }
  }
  if (!serverSessionId) {
    if (!existingServerSessionInfo) throw httpError(400, 'missing exchange token')
    serverSessionId = existingServerSessionInfo.session
  }

  const sessionInfo: SessionInfoPayload = { user: payload.id, session: serverSessionId, adminMode: payload.adminMode }
  // case of asAdmin
  if (existingServerSessionInfo && existingServerSessionInfo.adminMode && payload.id !== existingServerSessionInfo.user) {
    sessionInfo.adminMode = 1
    sessionInfo.user = existingServerSessionInfo.user
  }

  // adminMode sessions have a short HARD expiry: the exchange token is signed with
  // jwtDurations.adminExchangeToken when adminMode is granted and renewals (keepalive,
  // asAdmin switches) keep the original exp instead of extending it. When it lapses,
  // keepalive fails and the user must fully re-authenticate. Normal sessions keep the
  // rolling jwtDurations.exchangeToken window.
  let exchangeExp = Math.floor(date / 1000) + jwtDurations.exchangeToken
  if (sessionInfo.adminMode) {
    if (existingServerSessionInfo?.adminMode && existingServerSessionInfo.session === sessionInfo.session && existingServerSessionInfo.exp) {
      exchangeExp = existingServerSessionInfo.exp
    } else {
      exchangeExp = Math.floor(date / 1000) + jwtDurations.adminExchangeToken
    }
  }

  const token = await signToken(payload, exp)
  const parts = token.split('.')
  const opts: Cookies.SetOption = { sameSite: 'lax', path: sitePath + '/' }
  const deleteOpts = { path: sitePath + '/', expires: new Date(0) }
  if (payload.rememberMe) opts.expires = new Date(exchangeExp * 1000)
  cookies.set('id_token', parts[0] + '.' + parts[1], { ...opts, httpOnly: false })
  cookies.set('id_token_sign', parts[2], { ...opts, expires: new Date(exp * 1000), httpOnly: true })
  // set the same params to id_token_org cookie so that it doesn't expire before the rest
  if (userOrg) {
    cookies.set('id_token_org', userOrg.id, { ...opts, httpOnly: false })
    if (userOrg.department) cookies.set('id_token_dep', userOrg.department, { ...opts, httpOnly: false })
    else cookies.set('id_token_dep', '', deleteOpts)
    if (config.multiRoles) cookies.set('id_token_role', userOrg.role, { ...opts, httpOnly: false })
    else cookies.set('id_token_role', '', deleteOpts)
  } else {
    cookies.set('id_token_org', '', deleteOpts)
    cookies.set('id_token_dep', '', deleteOpts)
    cookies.set('id_token_role', '', deleteOpts)
  }

  if (existingServerSessionInfo && existingServerSessionInfo.session !== serverSessionId) {
    // case of a session where id_token was cleared but id_token_ex persisted, this server sessions is deprecated and can be cleared
    await storages.deleteSessionById(existingServerSessionInfo.session)
  }
  if (options?.skipExchangeToken) {
    cookies.set('id_token_ex', '', { ...deleteOpts, path: sitePath + '/simple-directory/', httpOnly: true })
  } else {
    const exchangeCookieOpts = { ...opts, expires: new Date(exchangeExp * 1000), path: sitePath + '/simple-directory/', httpOnly: true }
    const exchangeToken = await signToken(sessionInfo, exchangeExp)
    cookies.set('id_token_ex', exchangeToken, exchangeCookieOpts)
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: PASS (all tests in the file). Note: the dev server reloads on file change (`node --watch`) — give it a moment after saving before running the tests.

- [ ] **Step 5: Run the existing session tests for regressions**

Run: `npm run test-base tests/features/session.api.spec.ts`
Expected: PASS — in particular `Toggle admin mode` (drop adminMode goes back to a normal 30d session) and `Toggle asAdmin mode` (asAdmin keepalives keep working under the preserved-exp rule).

- [ ] **Step 6: Commit**

```bash
git add api/src/tokens/service.ts tests/features/admin-sessions.api.spec.ts
git commit -m "feat(auth): hard 12h expiry for adminMode session exchange tokens"
```

---

### Task 4: SAML `ForceAuthn="true"` on adminMode logins

OIDC already sends `prompt=login` for adminMode (`api/src/oauth/service.ts:124`). samlify has no per-request `forceAuthn` option; its `createLoginRequest(idp, binding, customTagReplacement)` uses a custom-template path only when the SP has a `loginRequestTemplate` **and** a `customTagReplacement` callback is passed — so setting the template on the SP is inert for normal logins.

**Files:**
- Modify: `api/src/saml2/service.ts` (template constant + tag-replacement factory + SP setting)
- Modify: `api/src/services.ts` (re-export)
- Modify: `api/src/auth/router.ts:849-850` (conditional call) and the two `TODO` comments at lines 734 and 840
- Create: `tests/features/saml2-force-authn.unit.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/saml2-force-authn.unit.spec.ts`:

```ts
import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { inflateRawSync } from 'node:zlib'

// Minimal env bootstrap so `import '#config'` loads the test config without requiring
// the full in-process server setup (same pattern as saml2-schema-validator.unit.spec.ts).
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const idpMetadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test/metadata">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" WantAuthnRequestsSigned="false">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.test/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>`

// the SAMLRequest query param of a redirect-binding URL is base64(deflate-raw(xml))
const decodeSamlRequest = (loginRequestUrl: string) => {
  const samlRequest = new URL(loginRequestUrl).searchParams.get('SAMLRequest')
  assert.ok(samlRequest)
  return inflateRawSync(Buffer.from(samlRequest, 'base64')).toString()
}

test.describe('SAML2 ForceAuthn on adminMode logins', () => {
  test('adminMode requests carry ForceAuthn="true", normal requests do not', async () => {
    const samlify = (await import('samlify')).default
    const { createForceAuthnTagReplacement, forceAuthnLoginRequestTemplate } = await import('../../api/src/saml2/service.ts')

    const idp = samlify.IdentityProvider({ metadata: idpMetadata })
    const sp = samlify.ServiceProvider({
      entityID: 'https://sd.test/api/auth/saml2-metadata.xml',
      assertionConsumerService: [{
        Binding: samlify.Constants.namespace.binding.post,
        Location: 'https://sd.test/api/auth/saml2-assert'
      }],
      // @ts-ignore same string-typed value as in initServiceProvider
      allowCreate: 'false',
      loginRequestTemplate: { context: forceAuthnLoginRequestTemplate }
    })

    // normal login: default samlify path, no ForceAuthn
    const normal = sp.createLoginRequest(idp, 'redirect')
    const normalXml = decodeSamlRequest(normal.context)
    assert.ok(!normalXml.includes('ForceAuthn'))

    // adminMode login: custom template path with ForceAuthn
    const admin = sp.createLoginRequest(idp, 'redirect', createForceAuthnTagReplacement(sp, idp))
    const adminXml = decodeSamlRequest(admin.context)
    assert.ok(adminXml.includes('ForceAuthn="true"'))
    assert.ok(!adminXml.includes('{'), `unreplaced template tags in: ${adminXml}`)
    assert.ok(adminXml.includes('Destination="https://idp.test/sso"'))
    assert.ok(adminXml.includes('AssertionConsumerServiceURL="https://sd.test/api/auth/saml2-assert"'))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-base tests/features/saml2-force-authn.unit.spec.ts`
Expected: FAIL — `createForceAuthnTagReplacement` and `forceAuthnLoginRequestTemplate` are not exported yet.

- [ ] **Step 3: Implement in `api/src/saml2/service.ts`**

Add after the `getSamlProviderId` function (~line 75):

```ts
// samlify's default login request template (libsaml.ts defaultLoginRequestTemplate) with an
// added ForceAuthn="true" attribute. Used only for adminMode logins, through
// createForceAuthnTagReplacement: a SAML adminMode login must not reuse an existing IdP
// session (the OIDC equivalent is prompt=login in oauth/service.ts).
export const forceAuthnLoginRequestTemplate = '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{ID}" Version="2.0" IssueInstant="{IssueInstant}" Destination="{Destination}" ForceAuthn="true" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="{AssertionConsumerServiceURL}"><saml:Issuer>{Issuer}</saml:Issuer><samlp:NameIDPolicy Format="{NameIDFormat}" AllowCreate="{AllowCreate}"/></samlp:AuthnRequest>'

// samlify only takes the custom-template path of createLoginRequest when this callback is
// passed alongside an sp loginRequestTemplate setting; it must perform the tag replacement
// itself (mirroring the values of samlify's default path in binding-redirect.ts)
export const createForceAuthnTagReplacement = (sp: samlify.ServiceProviderInstance, idp: samlify.IdentityProviderInstance) => {
  return () => {
    const spSetting: any = sp.entitySetting
    const id: string = spSetting.generateID()
    const nameIDFormat = spSetting.nameIDFormat
    const selectedNameIDFormat = Array.isArray(nameIDFormat) ? nameIDFormat[0] : nameIDFormat
    const context = forceAuthnLoginRequestTemplate
      .replace('{ID}', id)
      .replace('{Destination}', idp.entityMeta.getSingleSignOnService(samlify.Constants.namespace.binding.redirect) as string)
      .replace('{Issuer}', sp.entityMeta.getEntityID())
      .replace('{IssueInstant}', new Date().toISOString())
      .replace('{NameIDFormat}', selectedNameIDFormat)
      .replace('{AllowCreate}', spSetting.allowCreate)
      .replace('{AssertionConsumerServiceURL}', sp.entityMeta.getAssertionConsumerService(samlify.Constants.namespace.binding.post) as string)
    return { id, context }
  }
}
```

In `initServiceProvider`, add the template to the **trusted** fields (after the `config.saml2.sp` spread, next to `wantAssertionsSigned`):

```ts
    wantAssertionsSigned: true,
    // trusted field, set after the config spread: the mere presence of loginRequestTemplate
    // is inert for normal logins (samlify only uses it when a customTagReplacement is also
    // passed); adminMode logins pass createForceAuthnTagReplacement to send ForceAuthn
    loginRequestTemplate: { context: forceAuthnLoginRequestTemplate },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test-base tests/features/saml2-force-authn.unit.spec.ts`
Expected: PASS. If the `{NameIDFormat}` replacement produces `undefined`, samlify's SP default `nameIDFormat` is empty in this version — in that case add `nameIDFormat: ['urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress']` to the test SP **and** keep the helper as-is (the real SP gets its format from config or samlify defaults); the `!adminXml.includes('{')` assertion is the guard that matters.

- [ ] **Step 5: Wire into the SAML login route**

In `api/src/services.ts`, find the line re-exporting from `./saml2/service.ts` and add `createForceAuthnTagReplacement` to it.

In `api/src/auth/router.ts`, replace line 850:

```ts
  const { context: loginRequestURL } = sp.createLoginRequest(provider.idp, 'redirect')
```

with:

```ts
  // adminMode must not reuse an existing IdP session: pass the ForceAuthn tag replacement
  // (the OIDC equivalent is prompt=login, see oauthLogin above)
  const { context: loginRequestURL } = relayState.adminMode
    ? sp.createLoginRequest(provider.idp, 'redirect', createForceAuthnTagReplacement(sp, provider.idp))
    : sp.createLoginRequest(provider.idp, 'redirect')
```

and add `createForceAuthnTagReplacement` to the big `#services` import at the top of the file.

- [ ] **Step 6: Resolve the stale TODO comments**

In `api/src/auth/router.ts:734` (oauth relay state), replace:

```ts
    adminMode: !!(req.query.adminMode as string) // TODO: force re-submit password in this case ?
```

with:

```ts
    // adminMode via SSO trusts the IdP's own MFA; prompt=login forces a fresh IdP authentication
    adminMode: !!(req.query.adminMode as string)
```

In `api/src/auth/router.ts:840` (saml relay state), replace:

```ts
    adminMode: !!(req.query.adminMode as string), // TODO: force re-submit password in this case ?
```

with:

```ts
    // adminMode via SSO trusts the IdP's own MFA; ForceAuthn forces a fresh IdP authentication
    adminMode: !!(req.query.adminMode as string),
```

- [ ] **Step 7: Type-check, run SAML tests, commit**

Run: `npm run check-types && npm run test-base tests/features/saml2-force-authn.unit.spec.ts tests/features/saml2-schema-validator.unit.spec.ts`
Expected: both exit 0.

```bash
git add api/src/saml2/service.ts api/src/services.ts api/src/auth/router.ts tests/features/saml2-force-authn.unit.spec.ts
git commit -m "feat(auth): send ForceAuthn=true on SAML adminMode logins"
```

---

### Task 5: `offerAdminMode` flag — API side of the in-login prompt

After full validation of a normal password login, if the SD login page sent `offerAdminMode: true` and the user is a superadmin (and adminMode is permitted on this site), respond `{ step: 'adminMode' }` instead of creating a session.

**Files:**
- Modify: `api/doc/auth/post-password-req/schema.js`
- Modify: `api/src/auth/router.ts` (after the 2FA block, ~line 249)
- Test: `tests/features/admin-sessions.api.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/features/admin-sessions.api.spec.ts`:

```ts
  test('offerAdminMode proposes adminMode to superadmins only', async () => {
    // superadmin: the flag yields a step response and no session cookies
    const adminAx = await axiosAuth({ email: 'admin@test.com' }) as AxiosAuthInstance
    let res = await adminAx.post('/api/auth/password', { email: 'admin@test.com', password: 'TestPasswd01', offerAdminMode: true })
    assert.deepEqual(res.data, { step: 'adminMode' })

    // accepting the proposal: resubmit with adminMode (no 2FA configured in this test)
    await passwordLoginFull(adminAx, { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true })
    const me = (await adminAx.get('/api/auth/me')).data
    assert.ok(me.adminMode)

    // normal user: the flag is ignored and a regular callback url is returned
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com' }) as AxiosAuthInstance
    res = await ax.post('/api/auth/password', { email: 'dmeadus0@answers.com', password: 'TestPasswd01', offerAdminMode: true })
    assert.equal(typeof res.data, 'string')
    assert.ok(res.data.includes('token_callback'))
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: the new test FAILS — currently a 400 (schema `additionalProperties: false` rejects `offerAdminMode`).

- [ ] **Step 3: Add the flag to the request schema**

In `api/doc/auth/post-password-req/schema.js`, add after the `adminMode` property:

```js
        adminMode: { type: 'boolean' },
        offerAdminMode: { type: 'boolean' },
```

Run: `npm run build-types`
Expected: exits 0, regenerates `api/doc/auth/post-password-req/.type/*` so `PostPasswordAuthReq['body']` includes `offerAdminMode?: boolean`.

- [ ] **Step 4: Implement the step response**

In `api/src/auth/router.ts`, right after the closing brace of the 2FA management block (~line 249) and before `eventsLog.info('sd.auth.password.ok', ...)`, insert:

```ts
  // the SD login page sends offerAdminMode on normal logins: when the fully validated user
  // turns out to be a superadmin (and adminMode is permitted on this site) we propose
  // switching to adminMode before creating any session (see login.vue step 'adminMode').
  // The accept path is a new POST with adminMode=true that goes through the full
  // re-validation including the fresh-TOTP rule.
  if (body.offerAdminMode && !body.adminMode && payload.isAdmin && (!site || config.adminModeOnSites)) {
    eventsLog.info('sd.auth.password.admin-prompt', 'a superadmin was offered admin mode at login', logContext)
    return res.send({ step: 'adminMode' })
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 6: Commit**

```bash
git add api/doc/auth/post-password-req/ api/src/auth/router.ts tests/features/admin-sessions.api.spec.ts
git commit -m "feat(auth): offerAdminMode flag proposes adminMode at login for superadmins"
```

---

### Task 6: Login page — adminMode prompt step (UI)

**Files:**
- Modify: `ui/src/pages/login.vue` (template: new window-item; script: flag, response handling, accept/decline actions, step title)
- Modify: `api/i18n/fr.js`, `api/i18n/en.js`, `api/i18n/es.js`, `api/i18n/pt.js`, `api/i18n/de.js`, `api/i18n/it.js` (4 new `pages.login.*` keys each)
- Test: `tests/features/login.e2e.spec.ts`

- [ ] **Step 1: Write the failing e2e tests**

Add to `tests/features/login.e2e.spec.ts` inside the existing `test.describe('Login page', ...)`:

```ts
  test('superadmin is offered admin mode at login and can accept', async ({ page, appUrl }) => {
    await testEnvAx.post('/seed')

    await page.goto(appUrl('/login'))
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[name="email"]').fill('admin@test.com')
    await page.locator('input[name="password"]').fill('TestPasswd01')
    await page.locator('input[name="password"]').press('Enter')

    // the admin mode proposal step appears (no redirect yet)
    const acceptBtn = page.getByRole('button', { name: /mode administration|admin mode/i })
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
    await acceptBtn.click()

    // accepted: logged in (no 2FA configured on the seeded admin in the dev env)
    await page.waitForURL(/\/simple-directory\/(?!login)/, { timeout: 10_000 })
  })

  test('superadmin can decline admin mode and get a normal session', async ({ page, appUrl }) => {
    await testEnvAx.post('/seed')

    await page.goto(appUrl('/login'))
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[name="email"]').fill('admin@test.com')
    await page.locator('input[name="password"]').fill('TestPasswd01')
    await page.locator('input[name="password"]').press('Enter')

    const declineBtn = page.getByRole('button', { name: /session normale|normal session/i })
    await expect(declineBtn).toBeVisible({ timeout: 10_000 })
    await declineBtn.click()

    await page.waitForURL(/\/simple-directory\/(?!login)/, { timeout: 10_000 })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test-base tests/features/login.e2e.spec.ts`
Expected: the two new tests FAIL (no proposal step appears; the login redirects directly). Pre-existing tests still pass.

- [ ] **Step 3: Add the i18n keys**

In each of `api/i18n/{fr,en,es,pt,de,it}.js`, add 4 keys right after the existing `adminMode:` key in the `pages.login` section.

`fr.js`:
```js
      adminModePromptTitle: 'Mode administration',
      adminModePromptMsg: 'Votre compte est un compte de super-administrateur. Souhaitez-vous activer le mode administration pour cette session ?',
      adminModePromptAccept: 'mode administration',
      adminModePromptDecline: 'session normale',
```

`en.js`:
```js
      adminModePromptTitle: 'Admin mode',
      adminModePromptMsg: 'Your account is a super-administrator account. Do you want to activate admin mode for this session?',
      adminModePromptAccept: 'admin mode',
      adminModePromptDecline: 'normal session',
```

`es.js`:
```js
      adminModePromptTitle: 'Modo administración',
      adminModePromptMsg: 'Su cuenta es una cuenta de superadministrador. ¿Desea activar el modo administración para esta sesión?',
      adminModePromptAccept: 'modo administración',
      adminModePromptDecline: 'sesión normal',
```

`pt.js`:
```js
      adminModePromptTitle: 'Modo de administração',
      adminModePromptMsg: 'A sua conta é uma conta de superadministrador. Deseja ativar o modo de administração para esta sessão?',
      adminModePromptAccept: 'modo de administração',
      adminModePromptDecline: 'sessão normal',
```

`de.js`:
```js
      adminModePromptTitle: 'Administrationsmodus',
      adminModePromptMsg: 'Ihr Konto ist ein Superadministrator-Konto. Möchten Sie den Administrationsmodus für diese Sitzung aktivieren?',
      adminModePromptAccept: 'Administrationsmodus',
      adminModePromptDecline: 'normale Sitzung',
```

`it.js`:
```js
      adminModePromptTitle: 'Modalità amministrazione',
      adminModePromptMsg: 'Il tuo account è un account di superamministratore. Vuoi attivare la modalità amministrazione per questa sessione?',
      adminModePromptAccept: 'modalità amministrazione',
      adminModePromptDecline: 'sessione normale',
```

- [ ] **Step 4: Implement the UI changes in `ui/src/pages/login.vue`**

**4a.** Script — add a ref near the other 2FA refs (~line 883):

```ts
const adminModeDeclined = ref(false)
```

**4b.** Script — add the step title to `stepsTitles` (~line 899):

```ts
  adminMode: t('pages.login.adminModePromptTitle'),
```

**4c.** Script — replace the `passwordAuth` body construction and response handling (~lines 1060-1074). The body gains `offerAdminMode` and the response can now be the step object:

```ts
const passwordAuth = useAsyncAction(async () => {
  try {
    const body: PostPasswordAuthReq['body'] = {
      email: email.value,
      password: password.value,
      adminMode: adminMode.value,
      offerAdminMode: !adminMode.value && !adminModeDeclined.value,
      rememberMe: rememberMe.value && !adminMode.value,
      org: orgId,
      dep: depId,
      '2fa': twoFACode.value,
      membersOnly: membersOnly.value,
      orgStorage: orgStorage.value
    }
    const res = await $fetch<string | { step: string }>('auth/password', { method: 'POST', body, params: { redirect } })
    if (typeof res === 'object' && res?.step === 'adminMode') {
      step.value = 'adminMode'
      return
    }
    window.location.href = res as string
  } catch (error: any) {
    ...unchanged catch block...
  }
}, { catch: 'all' })
```

(Keep the existing `catch` block exactly as it is.)

**4d.** Script — add the accept/decline actions right after `passwordAuth`:

```ts
// in-login admin mode proposal (step 'adminMode', see api/src/auth/router.ts offerAdminMode):
// both paths resubmit the password held in form state, accept goes through the full
// adminMode validation including the fresh-TOTP rule (a 2fa-required error brings the
// user back to the login step with the TOTP field visible)
const acceptAdminMode = () => {
  adminMode.value = true
  step.value = 'login'
  passwordAuth.execute()
}
const declineAdminMode = () => {
  adminModeDeclined.value = true
  step.value = 'login'
  passwordAuth.execute()
}
```

**4e.** Template — add a new window-item right after the `login` window-item (after line 251 `</v-window-item>`):

```html
          <v-window-item value="adminMode">
            <v-card-text>
              <p class="text-warning mb-6">
                {{ $t('pages.login.adminModePromptMsg') }}
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn
                variant="text"
                @click="declineAdminMode"
              >
                {{ $t('pages.login.adminModePromptDecline') }}
              </v-btn>
              <v-spacer />
              <v-btn
                color="admin"
                variant="flat"
                style="text-transform: uppercase"
                @click="acceptAdminMode"
              >
                {{ $t('pages.login.adminModePromptAccept') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>
```

- [ ] **Step 5: Run the e2e tests to verify they pass**

Run: `npm run test-base tests/features/login.e2e.spec.ts`
Expected: PASS (all, including pre-existing). The dev UI is served by a vite dev server managed by the user — changes are hot-reloaded.

- [ ] **Step 6: Lint, type-check, commit**

Run: `npm run lint && npm run check-types`
Expected: exit 0.

```bash
git add ui/src/pages/login.vue api/i18n/ tests/features/login.e2e.spec.ts
git commit -m "feat(ui): in-login admin mode proposal step for superadmins"
```

---

### Task 7: Architecture documentation update

**Files:**
- Modify: `docs/architecture/email-trust-and-site-isolation.md`

- [ ] **Step 1: Update the adminMode bullet and invariants**

In the "Preventing SSO superadmin escalation" section, after the `**adminMode is main-site only**` bullet, add a new bullet:

```markdown
- **adminMode sessions are hardened** — entering adminMode by password always
  demands a fresh TOTP when 2FA is configured (the 30-day `id_token_2fa_*`
  cookie is ignored for adminMode logins). The session's exchange token is
  signed with `jwtDurations.adminExchangeToken` (default 12h) and renewals
  keep the original `exp` (hard expiry: when it lapses the user is logged out
  and must fully re-authenticate). SSO adminMode logins trust the IdP's own
  MFA by deployment decision, and force a fresh IdP authentication
  (`prompt=login` for OIDC, `ForceAuthn="true"` for SAML — honored by the
  operator-declared IdP, `auth_time` is not verified).
```

In the "Invariants" list, append:

```markdown
6. An adminMode session expires at most `jwtDurations.adminExchangeToken`
   (default 12h) after adminMode was granted, and a password-based adminMode
   login never reuses a remembered 2FA validation.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/email-trust-and-site-isolation.md
git commit -m "docs: document adminMode session hardening in architecture doc"
```

---

### Task 8: Final quality pass

- [ ] **Step 1: Lint and type-check the whole repo**

Run: `npm run lint && npm run check-types`
Expected: exit 0.

- [ ] **Step 2: Run all the test files touched or related**

Run: `npm run test-base tests/features/admin-sessions.api.spec.ts tests/features/session.api.spec.ts tests/features/saml2-force-authn.unit.spec.ts tests/features/saml2-schema-validator.unit.spec.ts tests/features/login.e2e.spec.ts tests/features/admin-credentials.api.spec.ts tests/features/pseudo-session.api.spec.ts`
Expected: PASS. `admin-credentials` and `pseudo-session` are included because they exercise adminMode/asAdmin login paths affected by Tasks 1, 3 and 5.

- [ ] **Step 3: Fix anything that fails, commit fixes**

If `oidc.api.spec.ts` or other auth-related suites are suspected, run them too. The full suite runs on push via the git hook.
