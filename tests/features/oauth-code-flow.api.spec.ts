import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { CookieJar } from 'tough-cookie'
import { axiosWithCookies } from '@data-fair/lib-node/axios-with-cookies.js'
import { axios, createUser, testEnvAx, getServerConfig, directoryUrl, devApiUrl, passwordLogin } from '../support/axios.ts'
import { signAssertion, nhiBody } from '../support/nhi.ts'
import {
  runCodeFlow, startAuthorization, openInteraction, getDetails, postDecision, resume, exchangeCode,
  browse, interactionUid, tokenRequest, type CodeFlowOptions
} from '../support/oauth-client.ts'
import {
  siteHost, siteUrl, issuer, realmHost, realmUrl, redirectUri, password, clientBody, grantRecords, setup, patchClient
} from '../support/oauth-code-site.ts'

// the authorization request ends at the client with an error
const authorizeError = async (opts: CodeFlowOptions) => {
  const { location } = await startAuthorization(opts)
  const url = new URL(location)
  assert.equal(url.origin + url.pathname, redirectUri, 'not redirected to the client: ' + location)
  return url.searchParams.get('error')
}

const withOAuthServer = async (patch: Record<string, any>, fn: () => Promise<void>) => {
  const oauthServer = (await testEnvAx.get('/config')).data.oauthServer
  await testEnvAx.patch('/config', { oauthServer: { ...oauthServer, ...patch } })
  try {
    await fn()
  } finally {
    await testEnvAx.patch('/config', { oauthServer })
  }
}

const withCodeFlowOff = (fn: () => Promise<void>) => withOAuthServer({ siteClients: false, agentClients: false }, fn)

test.describe('oauth authorization code flow', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('full code flow issues a user at+jwt and a refresh token', async () => {
    const { org, user, clientId, flow } = await setup()
    const result = await runCodeFlow(flow({ scope: 'openid organizations:read', decision: { account: { type: 'organization', id: org.id } } }))
    assert.equal(result.iss, issuer)

    const accessToken = jwt.decode(result.tokens.access_token, { complete: true }) as jwt.Jwt
    assert.equal(accessToken.header.typ, 'at+jwt')
    assert.ok(accessToken.header.kid?.startsWith('scoped-'), accessToken.header.kid)
    const payload = accessToken.payload as jwt.JwtPayload
    assert.equal(payload.iss, issuer)
    assert.equal(payload.sub, user.id)
    assert.equal(payload.client_id, clientId)
    assert.equal(payload.aud, siteUrl)
    assert.equal(payload.scope, 'organizations:read')
    assert.equal(result.tokens.scope, 'organizations:read')
    assert.equal(payload.organizations.length, 1)
    assert.equal(payload.organizations[0].id, org.id)
    for (const key of ['isAdmin', 'adminMode', 'asAdmin']) assert.equal(payload[key], undefined, key)
    assert.equal(payload.exp! - payload.iat!, 900)

    const idToken = jwt.decode(result.tokens.id_token) as jwt.JwtPayload
    assert.equal(idToken.sub, user.id)
    assert.equal(idToken.aud, clientId)
    assert.ok(result.tokens.refresh_token)

    const res = await axios().get(`${issuer}/api/organizations/${org.id}`, { headers: { authorization: 'Bearer ' + result.tokens.access_token } })
    assert.equal(res.status, 200)
    assert.equal(res.data.id, org.id)

    const records = await grantRecords({ clientId })
    assert.equal(records.length, 1)
    assert.equal(records[0].clientKind, 'site')
    assert.deepEqual(records[0].subject, { type: 'user', id: user.id })
    assert.equal(records[0].account.id, org.id)
    assert.equal(records[0].scope, 'organizations:read')
    assert.deepEqual(records[0].resources, [siteUrl])
    assert.equal(records[0].authorizedBy.id, user.id)
    // a dashboard grant lasts 30 days
    assert.ok(Math.abs(records[0].expiresAt.getTime() - Date.now() - 30 * 86400000) < 60000)
  })

  test('the personal account binds no organization, profile and email reach the id token', async () => {
    const { user, flow } = await setup()
    const result = await runCodeFlow(flow({ scope: 'openid profile email organizations:read', decision: { account: { type: 'user', id: user.id } } }))
    const payload = jwt.decode(result.tokens.access_token) as jwt.JwtPayload
    assert.deepEqual(payload.organizations, [])
    assert.equal(payload.scope, 'organizations:read')
    const idToken = jwt.decode(result.tokens.id_token) as jwt.JwtPayload
    assert.equal(idToken.email, 'oauth-code-user@test.com')
    assert.equal(idToken.name, user.name)
  })

  test('details describe the client, the scopes and the accounts', async () => {
    const { org, user, clientId, flow } = await setup()
    const opts = flow({ scope: 'openid organizations:read' })
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const details = await getDetails(opts, uid)
    assert.deepEqual(details.client, { id: clientId, name: 'Dash', kind: 'site', verified: true, redirectHost: 'localhost:5999' })
    assert.deepEqual(details.resource, { url: siteUrl, kind: 'api' })
    assert.equal(details.scopes.length, 1)
    assert.equal(details.scopes[0].name, 'organizations:read')
    assert.ok(details.scopes[0].description)
    assert.equal(details.scopes[0].broad, false)
    assert.deepEqual(details.oidcScopes, ['openid'])
    // the owner org of the site comes first
    assert.deepEqual(details.accounts.map((a: any) => [a.type, a.id]), [['organization', org.id], ['user', user.id]])
  })

  test('pkce is required', async () => {
    const { flow } = await setup()
    assert.equal(await authorizeError(flow({ extraParams: { code_challenge: undefined, code_challenge_method: undefined } })), 'invalid_request')
  })

  test('a wrong verifier fails the exchange', async () => {
    const { flow } = await setup()
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const details = await getDetails(opts, uid)
    const decided = await postDecision(opts, uid, { decision: 'allow', account: details.accounts[0], scopes: ['organizations:read'] })
    const callback = await resume(opts, decided.data.redirectTo)
    const res = await exchangeCode(opts, callback.searchParams.get('code')!, 'x'.repeat(43))
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_grant')
  })

  test('scopes outside the client registration are dropped; nothing left is invalid_scope', async () => {
    const { flow } = await setup()
    const result = await runCodeFlow(flow({ scope: 'organizations:read datasets:read' }))
    assert.deepEqual(result.details.scopes.map((s: any) => s.name), ['organizations:read'])
    assert.equal((jwt.decode(result.tokens.access_token) as jwt.JwtPayload).scope, 'organizations:read')
    assert.equal(await authorizeError(flow({ scope: 'datasets:read' })), 'invalid_scope')
    // the decision cannot widen the scope either
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const details = await getDetails(opts, uid)
    for (const scopes of [['datasets:read'], [], ['organizations:read', 'organizations']]) {
      const res = await postDecision(opts, uid, { decision: 'allow', account: details.accounts[0], scopes })
      assert.equal(res.status, 400, JSON.stringify(scopes))
    }
  })

  test('without platform scope the client registration is proposed', async () => {
    const { flow } = await setup()
    const result = await runCodeFlow(flow({ scope: 'openid' }))
    assert.deepEqual(result.details.scopes.map((s: any) => s.name), ['organizations:read'])
    assert.equal((jwt.decode(result.tokens.access_token) as jwt.JwtPayload).scope, 'organizations:read')
  })

  test('a site client matches its redirect uris exactly', async () => {
    const { adminAx, clientId, flow } = await setup()
    const httpsUri = 'https://dash.example.org:8443/cb'
    await patchClient(adminAx, clientId, { redirectUris: [httpsUri, redirectUri] })
    for (const uri of [httpsUri, redirectUri]) {
      const { location } = await startAuthorization(flow({ redirectUri: uri }))
      interactionUid(location)
    }
    const variants = [
      'https://dash.example.org:9443/cb', 'https://dash.example.org/cb', 'https://dash.example.org:8443/cb/',
      'https://dash.example.org:8443/cb?x=1', 'https://dash.example.org:8443/CB',
      'http://localhost:6000/cb', 'http://localhost:5999/cb/', 'http://localhost:5999/cb?x=1', 'http://127.0.0.1:5999/cb'
    ]
    for (const variant of variants) {
      const { location } = await startAuthorization(flow({ redirectUri: variant }))
      const url = new URL(location)
      assert.ok(url.pathname.endsWith('/oauth/consent'), `${variant} not refused: ${location}`)
      assert.equal(url.searchParams.get('error'), 'invalid_redirect_uri', variant)
    }
  })

  test('the mcp resource is refused for a site client', async () => {
    const { flow } = await setup()
    assert.equal(await authorizeError(flow({ resource: siteUrl + '/mcp-server/mcp' })), 'invalid_target')
  })

  test('a realm site outside the client\'s resources is invalid_target; listed in resources it works', async () => {
    const { config, owner, adminAx, clientId, flow } = await setup()
    await axios().post('/api/sites', { _id: 'test_oauth_code_realm', owner, host: realmHost }, { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_oauth_code_realm', { authMode: 'onlyOtherSite', authOnlyOtherSite: siteHost })
    await testEnvAx.post('/clear-site-cache')
    assert.equal(await authorizeError(flow({ resource: realmUrl })), 'invalid_target')
    await patchClient(adminAx, clientId, { resources: [siteUrl, realmUrl] })
    const result = await runCodeFlow(flow({ resource: realmUrl }))
    assert.equal((jwt.decode(result.tokens.access_token) as jwt.JwtPayload).aud, realmUrl)
  })

  test('main site clients need the oauthClients category', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('oauth-code-main@test.com')
    const org = (await ax.post('/api/organizations', { name: 'OAuth main org' })).data
    await axios().post('/api/sites',
      { _id: 'test_oauth_main_site', owner: { type: 'organization', id: org.id, name: org.name }, host: new URL(config.publicUrl).host },
      { params: { key: config.secretKeys.sites } })
    const { ax: adminAx } = await createUser('admin@test.com', true)
    await adminAx.patch('/api/sites/test_oauth_main_site', { oauthClients: [clientBody()] })
    const clientId = (await adminAx.get('/api/sites/test_oauth_main_site', { params: { showAll: true } })).data.oauthClients[0].id
    await testEnvAx.post('/clear-site-cache')
    const opts: CodeFlowOptions = { issuer: directoryUrl, clientId, redirectUri, scope: 'organizations:read', browserAx: ax }
    // unknown client: the error cannot go to the client, it goes to the consent page
    const { location } = await startAuthorization(opts)
    assert.equal(location, directoryUrl + '/oauth/consent?error=invalid_client')
    await testEnvAx.patch('/config', { mainSiteFromDb: ['oauthClients'] })
    await testEnvAx.post('/clear-site-cache')
    try {
      const { location } = await startAuthorization(opts)
      assert.ok(location.startsWith(directoryUrl + '/api/oauth/interaction/'), location)
      interactionUid(location)
    } finally {
      await testEnvAx.patch('/config', { mainSiteFromDb: [] })
    }
  })

  test('superadmin in admin mode consents as a plain user', async () => {
    const config = await getServerConfig()
    const { ax: adminAx, user: admin } = await createUser('admin@test.com', true)
    const org = (await adminAx.post('/api/organizations', { name: 'OAuth admin org' })).data
    await axios().post('/api/sites',
      { _id: 'test_oauth_main_site', owner: { type: 'organization', id: org.id, name: org.name }, host: new URL(config.publicUrl).host },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_oauth_main_site', { oauthClients: [clientBody()] })
    const clientId = (await adminAx.get('/api/sites/test_oauth_main_site', { params: { showAll: true } })).data.oauthClients[0].id
    await testEnvAx.patch('/config', { mainSiteFromDb: ['oauthClients'] })
    await testEnvAx.post('/clear-site-cache')
    try {
      assert.equal((await adminAx.get('/api/auth/me')).data.adminMode, 1)
      const result = await runCodeFlow({ issuer: directoryUrl, clientId, redirectUri, scope: 'organizations:read', browserAx: adminAx, decision: { account: { type: 'user', id: admin.id } } })
      const payload = jwt.decode(result.tokens.access_token) as jwt.JwtPayload
      assert.equal(payload.sub, admin.id)
      for (const key of ['isAdmin', 'adminMode', 'asAdmin']) assert.equal(payload[key], undefined, key)
    } finally {
      await testEnvAx.patch('/config', { mainSiteFromDb: [] })
    }
  })

  test('an implicit client skips the consent screen for a member of the owner org, unless prompt=consent', async () => {
    const { org, user, userAx, clientId, flow } = await setup({ consent: 'implicit' })
    const opts = flow()
    const { pkce, location } = await startAuthorization(opts)
    const entry = await browse(userAx, location)
    assert.equal(entry.status, 303, JSON.stringify(entry.headers))
    const callback = await resume(opts, entry.headers.location)
    const tokens = (await exchangeCode(opts, callback.searchParams.get('code')!, pkce.verifier)).data
    const payload = jwt.decode(tokens.access_token) as jwt.JwtPayload
    assert.equal(payload.sub, user.id)
    assert.deepEqual(payload.organizations.map((o: any) => o.id), [org.id])
    const records = await grantRecords({ clientId })
    assert.equal(records.length, 1)
    assert.equal(records[0].account.id, org.id)
    // prompt=consent forces the screen
    const forced = flow({ extraParams: { prompt: 'consent' } })
    const { location: forcedLocation } = await startAuthorization(forced)
    assert.ok(await openInteraction(forced, forcedLocation))
  })

  // the whole implicit flow of a member of the owner org, no consent screen
  const implicitFlow = async (opts: CodeFlowOptions) => {
    const { pkce, location } = await startAuthorization(opts)
    const entry = await browse(opts.browserAx, location)
    assert.equal(entry.status, 303, JSON.stringify(entry.headers))
    const callback = await resume(opts, entry.headers.location)
    const res = await exchangeCode(opts, callback.searchParams.get('code')!, pkce.verifier)
    assert.equal(res.status, 200, JSON.stringify(res.data))
    return res.data
  }

  const refreshWorks = async (opts: CodeFlowOptions, refreshToken: string) => {
    const res = await tokenRequest(opts.issuer, { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: opts.clientId })
    assert.equal(res.status, 200, JSON.stringify(res.data))
  }

  test('implicit consent reuses the live grant', async () => {
    const { clientId, flow } = await setup({ consent: 'implicit' })
    const first = await implicitFlow(flow())
    const second = await implicitFlow(flow())
    assert.equal((await grantRecords({ clientId })).length, 1)
    await refreshWorks(flow(), first.refresh_token)
    await refreshWorks(flow(), second.refresh_token)
  })

  test('implicit consent with a new scope gets a new grant', async () => {
    const { clientId, flow } = await setup({ consent: 'implicit' })
    await implicitFlow(flow())
    const tokens = await implicitFlow(flow({ scope: 'openid profile organizations:read' }))
    assert.ok(tokens.id_token, 'the new scope was granted')
    assert.equal((await grantRecords({ clientId })).length, 2)
  })

  test('an implicit client shows the consent screen to a user outside the owner org', async () => {
    const { flow } = await setup({ consent: 'implicit' })
    const { ax: outsiderAx } = await createUser('oauth-code-outsider@test.com', false, password, issuer)
    const opts = flow({ browserAx: outsiderAx })
    const { location } = await startAuthorization(opts)
    assert.ok(await openInteraction(opts, location))
  })

  test('deny returns access_denied to the client', async () => {
    const { clientId, flow } = await setup()
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const decided = await postDecision(opts, uid, { decision: 'deny' })
    assert.equal(decided.status, 200, JSON.stringify(decided.data))
    const callback = await resume(opts, decided.data.redirectTo)
    assert.equal(callback.searchParams.get('error'), 'access_denied')
    assert.equal(callback.searchParams.get('code'), null)
    assert.equal((await grantRecords({ clientId })).length, 0)
  })

  test('no sd session redirects the interaction to the login page with a redirect back', async () => {
    const { flow } = await setup()
    const anonymousAx = axiosWithCookies({ axiosOpts: { maxRedirects: 0 } })
    const opts = flow({ browserAx: anonymousAx })
    const { location } = await startAuthorization(opts)
    const res = await browse(anonymousAx, location)
    assert.equal(res.status, 302)
    const login = new URL(res.headers.location)
    assert.equal(login.origin + login.pathname, issuer + '/login')
    assert.equal(login.searchParams.get('redirect'), location)
  })

  test('a scoped or nhi session is refused at the interaction', async () => {
    const { org, ownerAx, flow } = await setup()
    ownerAx.setOrg(org.id)
    for (const scopes of [undefined, ['organizations:read']]) {
      const nhi = (await ownerAx.post(`/api/organizations/${org.id}/nhis`, nhiBody({ name: 'Agent ' + (scopes ? 'scoped' : 'plain'), subject: 'agent-' + (scopes ? 'scoped' : 'plain'), scopes }))).data
      const res = await axios().post(issuer + '/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({ sub: 'agent-' + (scopes ? 'scoped' : 'plain'), aud: siteUrl }) })
      const cookieJar = new CookieJar()
      for (const cookie of res.headers['set-cookie'] ?? []) cookieJar.setCookieSync(cookie, siteUrl)
      const nhiAx = axiosWithCookies({ axiosOpts: { maxRedirects: 0 }, cookieJar })
      const opts = flow({ browserAx: nhiAx })
      const { location } = await startAuthorization(opts)
      const entry = await browse(nhiAx, location)
      assert.equal(entry.status, 302)
      assert.equal(entry.headers.location, issuer + '/oauth/consent?error=forbidden', JSON.stringify(scopes))
      const details = await nhiAx.get(`${issuer}/api/oauth/interaction/${interactionUid(location)}/details`, { validateStatus: () => true })
      assert.equal(details.status, 403)
    }
  })

  test('an impersonation (asAdmin) session is refused at the interaction', async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { user: target } = await createUser('oauth-code-target@test.com')
    const org = (await adminAx.post('/api/organizations', { name: 'OAuth asadmin org' })).data
    await axios().post('/api/sites',
      { _id: 'test_oauth_main_site', owner: { type: 'organization', id: org.id, name: org.name }, host: new URL(config.publicUrl).host },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_oauth_main_site', { oauthClients: [clientBody()] })
    const clientId = (await adminAx.get('/api/sites/test_oauth_main_site', { params: { showAll: true } })).data.oauthClients[0].id
    await testEnvAx.patch('/config', { mainSiteFromDb: ['oauthClients'] })
    await testEnvAx.post('/clear-site-cache')
    try {
      await adminAx.post('/api/auth/asadmin', { id: target.id })
      const me = (await adminAx.get('/api/auth/me')).data
      assert.equal(me.id, target.id)
      assert.ok(me.asAdmin)
      const opts: CodeFlowOptions = { issuer: directoryUrl, clientId, redirectUri, scope: 'organizations:read', browserAx: adminAx }
      const { location } = await startAuthorization(opts)
      const entry = await browse(adminAx, location)
      assert.equal(entry.status, 302)
      assert.equal(entry.headers.location, directoryUrl + '/oauth/consent?error=forbidden')
      const uid = interactionUid(location)
      assert.equal((await adminAx.get(`${directoryUrl}/api/oauth/interaction/${uid}/details`, { validateStatus: () => true })).status, 403)
      assert.equal((await postDecision(opts, uid, { decision: 'allow', account: { type: 'user', id: target.id }, scopes: ['organizations:read'] })).status, 403)
      assert.equal((await grantRecords({ clientId })).length, 0)
    } finally {
      await testEnvAx.patch('/config', { mainSiteFromDb: [] })
    }
  })

  test('a user of an organization storage is refused at the interaction', async () => {
    const { userAx, flow } = await setup()
    await testEnvAx.patch('/user/oauth-code-user@test.com', { orgStorage: true })
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const entry = await browse(userAx, location)
    assert.equal(entry.status, 302)
    assert.equal(entry.headers.location, issuer + '/oauth/consent?error=forbidden')
  })

  test('a scoped user session (an oauth access token as bearer) is refused at the interaction', async () => {
    const { userAx, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    // the browser keeps its interaction cookies, the session comes from the scoped access token
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const entry = await userAx.get(location, { maxRedirects: 0, validateStatus: () => true, headers: { authorization: 'Bearer ' + tokens.access_token } })
    assert.equal(entry.status, 302)
    assert.equal(entry.headers.location, issuer + '/oauth/consent?error=forbidden')
  })

  test('concurrent decisions create a single grant', async () => {
    const { clientId, flow } = await setup()
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const details = await getDetails(opts, uid)
    const decision = { decision: 'allow', account: details.accounts[0], scopes: ['organizations:read'] }
    const results = await Promise.all([0, 1, 2, 3].map(() => postDecision(opts, uid, decision)))
    assert.deepEqual(results.map(r => r.status).sort(), [200, 400, 400, 400])
    assert.equal((await grantRecords({ clientId })).length, 1)
  })

  test('an error on the implicit path redirects to the consent page', async () => {
    const { config, owner, adminAx, clientId, userAx, flow } = await setup({ consent: 'implicit' })
    await axios().post('/api/sites', { _id: 'test_oauth_code_realm', owner, host: realmHost }, { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_oauth_code_realm', { authMode: 'onlyOtherSite', authOnlyOtherSite: siteHost })
    await patchClient(adminAx, clientId, { consent: 'implicit', resources: [siteUrl, realmUrl] })
    const opts = flow({ resource: realmUrl })
    const { location } = await startAuthorization(opts)
    // the resource site disappears between the authorization request and the entry
    await adminAx.delete('/api/sites/test_oauth_code_realm')
    await testEnvAx.post('/clear-site-cache')
    const entry = await browse(userAx, location)
    assert.equal(entry.status, 302, JSON.stringify(entry.data))
    assert.equal(entry.headers.location, issuer + '/oauth/consent?error=invalid_target')
  })

  test('decision replayed after completion is 400; another user\'s session is 403', async () => {
    const { clientId, flow, userAx } = await setup()
    // replayed before and after the resume
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const details = await getDetails(opts, uid)
    const decision = { decision: 'allow', account: details.accounts[0], scopes: ['organizations:read'] }
    const decided = await postDecision(opts, uid, decision)
    assert.equal(decided.status, 200)
    assert.equal((await postDecision(opts, uid, decision)).status, 400)
    assert.equal((await postDecision(opts, uid, { decision: 'deny' })).status, 400)
    await resume(opts, decided.data.redirectTo)
    assert.equal((await postDecision(opts, uid, decision)).status, 400)
    assert.equal((await grantRecords({ clientId })).length, 1)

    // opened by the user, decided by another user logged in the same browser
    await createUser('oauth-code-other@test.com', false, password, issuer)
    const { location: location2 } = await startAuthorization(opts)
    const uid2 = await openInteraction(opts, location2)
    await passwordLogin(userAx as any, 'oauth-code-other@test.com', password)
    const details2 = await opts.browserAx.get(`${issuer}/api/oauth/interaction/${uid2}/details`, { validateStatus: () => true })
    assert.equal(details2.status, 403)
    assert.equal((await postDecision(opts, uid2, decision)).status, 403)
    assert.equal((await postDecision(opts, uid2, { decision: 'deny' })).status, 403)
    assert.equal((await grantRecords({ clientId })).length, 1)
  })

  test('two authorizations in the same browser by two users both succeed', async () => {
    const { user, userAx, flow } = await setup()
    const { user: other } = await createUser('oauth-code-other@test.com', false, password, issuer)
    const first = await runCodeFlow(flow())
    assert.equal((jwt.decode(first.tokens.access_token) as jwt.JwtPayload).sub, user.id)
    await passwordLogin(userAx as any, 'oauth-code-other@test.com', password)
    const second = await runCodeFlow(flow())
    assert.equal((jwt.decode(second.tokens.access_token) as jwt.JwtPayload).sub, other.id)
    // and back to the first user
    await passwordLogin(userAx as any, 'oauth-code-user@test.com', password)
    const third = await runCodeFlow(flow())
    assert.equal((jwt.decode(third.tokens.access_token) as jwt.JwtPayload).sub, user.id)
  })

  test('the consent page cannot be framed, other pages keep the default framing rules', async () => {
    // the dev nginx proxies the pages to the dev UI (vite): ask the API's SPA middleware directly
    const spa = axios({ baseURL: devApiUrl, headers: { 'x-forwarded-host': new URL(directoryUrl).host, 'x-forwarded-proto': 'http' } })
    // the router of the UI matches case insensitively and accepts a trailing slash
    for (const path of ['/simple-directory/oauth/consent', '/simple-directory/oauth/consent/', '/simple-directory/OAuth/Consent']) {
      const res = await spa.get(path, { params: { error: 'access_denied' } })
      assert.equal(res.status, 200, path)
      assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/, path)
      assert.doesNotMatch(res.headers['content-security-policy'], /frame-ancestors 'self'/, path)
      assert.match(res.headers['content-security-policy'], /script-src 'nonce-/, path)
      assert.equal(res.headers['x-frame-options'], 'DENY', path)
    }
    for (const path of ['/simple-directory/login', '/simple-directory/oauth/consent-other', '/simple-directory/me']) {
      const res = await spa.get(path)
      assert.equal(res.status, 200, path)
      assert.match(res.headers['content-security-policy'], /frame-ancestors 'self'/, path)
      assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN', path)
    }
  })

  test('discovery advertises the code flow', async () => {
    const discovery = (await axios().get('/.well-known/openid-configuration')).data
    assert.equal(discovery.authorization_endpoint, directoryUrl + '/api/oauth/authorize')
    assert.equal(discovery.revocation_endpoint, directoryUrl + '/api/oauth/revoke')
    assert.deepEqual(discovery.code_challenge_methods_supported, ['S256'])
    assert.deepEqual(discovery.response_types_supported, ['code'])
    assert.ok(discovery.grant_types_supported.includes('authorization_code'))
    assert.ok(discovery.grant_types_supported.includes('refresh_token'))
    assert.ok(!discovery.grant_types_supported.includes('implicit'))
    assert.deepEqual([...discovery.token_endpoint_auth_methods_supported].sort(), ['none', 'private_key_jwt'])
    assert.equal(discovery.authorization_response_iss_parameter_supported, true)
    for (const scope of ['openid', 'profile', 'email', 'offline_access', 'organizations:read']) {
      assert.ok(discovery.scopes_supported.includes(scope), scope)
    }
    await withCodeFlowOff(async () => {
      const m1 = (await axios().get('/.well-known/openid-configuration')).data
      for (const key of ['authorization_endpoint', 'revocation_endpoint', 'authorization_response_iss_parameter_supported']) {
        assert.equal(m1[key], undefined, key)
      }
      assert.ok(!m1.grant_types_supported.includes('authorization_code'))
      assert.ok(!m1.grant_types_supported.includes('refresh_token'))
      assert.deepEqual(m1.token_endpoint_auth_methods_supported, ['private_key_jwt'])
    })
  })

  test('interaction routes follow the flag and accept only their exact paths', async () => {
    const { flow } = await setup()
    const opts = flow()
    const { location } = await startAuthorization(opts)
    const uid = interactionUid(location)
    for (const path of [`/api/oauth/interaction/${uid}/`, `/api/oauth/Interaction/${uid}`, `/api/oauth/interaction/${uid}/details/`, '/api/oauth/interaction/x/y/z', `/api/oauth/authorize/${uid}/`, '/api/oauth/authorize/short']) {
      const res = await browse(opts.browserAx, issuer + path)
      assert.equal(res.status, 404, path)
    }
    await withCodeFlowOff(async () => {
      for (const path of [`/api/oauth/interaction/${uid}`, `/api/oauth/interaction/${uid}/details`, `/api/oauth/authorize/${uid}`, '/api/oauth/revoke']) {
        const res = await browse(opts.browserAx, issuer + path)
        assert.equal(res.status, 404, path)
      }
    })
  })

  test('site clients follow their own flag, the flow stays served for agent clients', async () => {
    const { org, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow({ decision: { account: { type: 'organization', id: org.id } } }))
    await withOAuthServer({ siteClients: false }, async () => {
      const discovery = (await axios().get(issuer + '/.well-known/openid-configuration')).data
      assert.equal(discovery.authorization_endpoint, issuer + '/api/oauth/authorize')
      assert.ok(discovery.grant_types_supported.includes('refresh_token'))
      // the site client is unknown: the error goes to the consent page, not to the client
      const { location } = await startAuthorization(flow())
      assert.equal(new URL(location).searchParams.get('error'), 'invalid_client')
      // and its grants cannot be refreshed
      const res = await tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: clientId })
      assert.equal(res.status, 401)
      assert.equal(res.data.error, 'invalid_client')
    })
  })
})
