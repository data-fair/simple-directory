// The NHI consent of dynamic clients: an org admin binds an MCP agent (here a DCR client
// registered with Claude Code's metadata) to an NHI of the org, existing or created inline.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { axios, createUser, testEnvAx } from '../support/axios.ts'
import { nhiBody, subject as nhiSubject } from '../support/nhi.ts'
import {
  runCodeFlow, startAuthorization, openInteraction, getDetails, postDecision, resume, exchangeCode, tokenRequest, type CodeFlowOptions
} from '../support/oauth-client.ts'
import { siteUrl, issuer, grantRecords, setup } from '../support/oauth-code-site.ts'

const mcpResource = siteUrl + '/mcp-server/mcp'
const dynamicRedirectUri = 'http://localhost:40321/callback'
const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

const registerClient = async () => {
  const res = await axios().post(issuer + '/api/oauth/register', claudeCode(), { validateStatus: () => true })
  assert.equal(res.status, 201, JSON.stringify(res.data))
  return res.data.client_id as string
}

// the code flow up to the decision; the decision is built from the details
const decide = async (opts: CodeFlowOptions, choose: (details: any) => Record<string, any>) => {
  const { pkce, state, location } = await startAuthorization(opts)
  const uid = await openInteraction(opts, location)
  const details = await getDetails(opts, uid)
  const decided = await postDecision(opts, uid, { decision: 'allow', ...choose(details) })
  return { uid, details, decided, pkce, state }
}

// the rest of the flow after an accepted decision
const finish = async (opts: CodeFlowOptions, started: Awaited<ReturnType<typeof decide>>, headers: Record<string, string> = {}) => {
  assert.equal(started.decided.status, 200, JSON.stringify(started.decided.data))
  const callback = await resume(opts, started.decided.data.redirectTo)
  assert.equal(callback.searchParams.get('state'), started.state)
  assert.ok(callback.searchParams.get('code'), 'no code in the callback: ' + callback.href)
  const tokenRes = await exchangeCode(opts, callback.searchParams.get('code')!, started.pkce.verifier, headers)
  assert.equal(tokenRes.status, 200, JSON.stringify(tokenRes.data))
  return tokenRes.data
}

const setupNhiConsent = async (membership: Record<string, any> = { role: 'admin' }) => {
  const base = await setup()
  const { org, ownerAx } = base
  // the user of the issuer site becomes an admin of the org
  await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, ...membership }] })
  ownerAx.setOrg(org.id)
  const dynamicClientId = await registerClient()
  const dynamicFlow = (extra: Partial<CodeFlowOptions> = {}): CodeFlowOptions => ({
    issuer, clientId: dynamicClientId, redirectUri: dynamicRedirectUri, scope: 'organizations:read', resource: mcpResource, browserAx: base.userAx, ...extra
  })
  let subjectCounter = 0
  const createNhi = async (extra: Record<string, any> = {}) =>
    (await ownerAx.post(`/api/organizations/${org.id}/nhis`, nhiBody({ subject: nhiSubject + '-' + (subjectCounter++), ...extra }))).data
  return { ...base, dynamicClientId, dynamicFlow, createNhi }
}

const orgAccount = (org: { id: string }) => ({ type: 'organization', id: org.id })

test.describe('oauth nhi consent', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('revoking the sessions of the authorizing admin revokes the nhi grants they authorized', async () => {
    const { org, user, adminAx, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ scopes: ['organizations:read'] })
    const opts = dynamicFlow()
    const tokens = await finish(opts, await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'] })))
    await adminAx.delete(`/api/users/${user.id}/sessions`)
    const res = await tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: dynamicClientId })
    assert.equal(res.status, 400, JSON.stringify(res.data))
    assert.equal((await grantRecords({ 'subject.id': nhi.id })).length, 0)
  })

  test('demoting the authorizing admin stops the refresh', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ scopes: ['organizations:read'] })
    const opts = dynamicFlow()
    const tokens = await finish(opts, await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'] })))
    await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, role: 'user' }] })
    const res = await tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: dynamicClientId })
    assert.equal(res.status, 400, JSON.stringify(res.data))
    assert.equal(res.data.error, 'invalid_grant')
  })

  test('malformed decision bodies are refused before the decision is taken', async () => {
    const { org, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ scopes: ['organizations:read'] })
    const opts = dynamicFlow()
    const { pkce, state, location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    const valid = { decision: 'allow', account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'] }
    const malformed = [
      { decision: 'maybe' },
      { ...valid, nhi: { id: nhi.id, create: { name: 'x', role: 'user', scopes: ['organizations:read'] } } },
      { ...valid, nhi: {} },
      { ...valid, scopes: 'organizations:read' },
      { ...valid, scopes: [] },
      { ...valid, lifetime: '2y' },
      { ...valid, account: { type: 'organization' } }
    ]
    for (const body of malformed) {
      const res = await postDecision(opts, uid, body)
      assert.equal(res.status, 400, JSON.stringify(body) + ' ' + JSON.stringify(res.data))
    }
    // validated before the lock: the interaction can still be decided
    await finish(opts, { uid, details: undefined, decided: await postDecision(opts, uid, valid), pkce, state })
  })

  test('admin binds an existing nhi and the client gets an nhi token for the mcp', async () => {
    const { org, user, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ name: 'Bound agent', scopes: ['organizations:read'] })
    const opts = dynamicFlow({ scope: 'openid profile email organizations:read' })
    const started = await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))

    // the details of a dynamic client
    const details = started.details
    assert.equal(details.client.id, dynamicClientId)
    assert.equal(details.client.kind, 'dcr')
    assert.equal(details.client.verified, false)
    assert.equal(details.client.registeredAutomatically, true)
    assert.equal(details.client.redirectHost, 'localhost:40321')
    assert.deepEqual(details.resource, { url: mcpResource, kind: 'mcp' })
    assert.deepEqual(details.organizations.map((o: any) => o.id), [org.id])
    assert.deepEqual(details.lifetimes, ['1d', '7d', '30d', '90d', '1y'])
    assert.equal(details.defaultLifetime, '30d')
    assert.deepEqual(details.scopes.map((s: any) => s.name), ['organizations:read'])
    // no key material is exposed
    assert.deepEqual(details.nhis[org.id], [{ id: nhi.id, name: 'Bound agent', scopes: ['organizations:read'] }])
    // no identity claim for an nhi subject
    assert.deepEqual(details.oidcScopes, ['openid'])

    const tokens = await finish(opts, started)
    const payload = jwt.decode(tokens.access_token) as jwt.JwtPayload
    assert.equal(payload.sub, nhi.id)
    assert.equal(payload.nhi, 1)
    assert.deepEqual(payload.aud, [siteUrl + '/mcp-server', siteUrl])
    assert.equal(payload.exp! - payload.iat!, 1800)
    assert.equal(payload.scope, 'organizations:read')
    assert.equal(payload.organizations.length, 1)
    assert.equal(payload.organizations[0].id, org.id)
    for (const key of ['isAdmin', 'adminMode', 'asAdmin']) assert.equal(payload[key], undefined, key)
    assert.ok(tokens.refresh_token)
    const idToken = jwt.decode(tokens.id_token) as jwt.JwtPayload
    assert.equal(idToken.sub, nhi.id)
    assert.equal(idToken.name, undefined)
    assert.equal(idToken.email, undefined)

    const records = await grantRecords({ clientId: dynamicClientId })
    assert.equal(records.length, 1)
    assert.equal(records[0].clientKind, 'dcr')
    assert.deepEqual(records[0].subject, { type: 'nhi', id: nhi.id })
    assert.deepEqual(records[0].account, { type: 'organization', id: org.id })
    assert.deepEqual(records[0].resources, [mcpResource])
    assert.equal(records[0].authorizedBy.id, user.id)
    assert.ok(Math.abs(records[0].expiresAt.getTime() - Date.now() - 30 * 86400000) < 60000)

    // the refresh keeps the nhi subject
    const refreshed = await tokenRequest(issuer, {
      grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: dynamicClientId
    })
    assert.equal(refreshed.status, 200, JSON.stringify(refreshed.data))
    assert.equal((jwt.decode(refreshed.data.access_token) as jwt.JwtPayload).sub, nhi.id)
  })

  test('admin creates an nhi inline', async () => {
    const { org, user, ownerAx, dynamicClientId, dynamicFlow } = await setupNhiConsent()
    const opts = dynamicFlow()
    const started = await decide(opts, () => ({
      account: orgAccount(org), nhi: { create: { name: 'Claude agent', role: 'user', scopes: ['organizations:read'] } }, scopes: ['organizations:read'], lifetime: '30d'
    }))
    const tokens = await finish(opts, started)
    const sub = (jwt.decode(tokens.access_token) as jwt.JwtPayload).sub!
    assert.ok(sub.startsWith('nhi-'))

    const listed = (await ownerAx.get(`/api/organizations/${org.id}/nhis`)).data.results.find((n: any) => n.id === sub)
    assert.ok(listed, 'the inline nhi is listed')
    assert.equal(listed.name, 'Claude agent')
    assert.equal(listed.role, 'user')
    assert.deepEqual(listed.scopes, ['organizations:read'])
    // no key binding
    assert.equal(listed.subject, undefined)
    assert.equal(listed.provider, undefined)

    const records = await grantRecords({ clientId: dynamicClientId })
    assert.deepEqual(records[0].subject, { type: 'nhi', id: sub })
    assert.equal(records[0].authorizedBy.id, user.id)
  })

  test('inline creation respects the member limit', async () => {
    const { org, adminAx, ownerAx, dynamicClientId, dynamicFlow } = await setupNhiConsent()
    await adminAx.post(`/api/limits/organization/${org.id}`, { store_nb_members: { limit: 2, consumption: 2 }, lastUpdate: new Date().toISOString() })
    const started = await decide(dynamicFlow(), () => ({
      account: orgAccount(org), nhi: { create: { name: 'Over limit', role: 'user', scopes: ['organizations:read'] } }, scopes: ['organizations:read'], lifetime: '30d'
    }))
    assert.equal(started.decided.status, 429, JSON.stringify(started.decided.data))
    assert.equal((await ownerAx.get(`/api/organizations/${org.id}/nhis`)).data.count, 0)
    assert.equal((await grantRecords({ clientId: dynamicClientId })).length, 0)
  })

  test('a non-admin member cannot consent for an org', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent({ role: 'user' })
    const nhi = await createNhi()
    const started = await decide(dynamicFlow(), () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))
    assert.deepEqual(started.details.organizations, [])
    assert.deepEqual(started.details.nhis, {})
    assert.ok([400, 403].includes(started.decided.status), String(started.decided.status))
    assert.equal((await grantRecords({ clientId: dynamicClientId })).length, 0)
  })

  test('a dep admin only with depAdminIsOrgAdmin', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent({ role: 'admin', department: 'dep1', departmentName: 'Dep 1' })
    const nhi = await createNhi()
    const account = { type: 'organization', id: org.id, department: 'dep1' }
    const refused = await decide(dynamicFlow(), () => ({ account, nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))
    assert.deepEqual(refused.details.organizations, [])
    assert.ok([400, 403].includes(refused.decided.status), String(refused.decided.status))
    assert.equal((await grantRecords({ clientId: dynamicClientId })).length, 0)

    await testEnvAx.patch('/config', { depAdminIsOrgAdmin: true })
    try {
      const opts = dynamicFlow()
      const started = await decide(opts, () => ({ account, nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))
      assert.deepEqual(started.details.organizations.map((o: any) => [o.id, o.department]), [[org.id, 'dep1']])
      assert.deepEqual(started.details.nhis[org.id].map((n: any) => n.id), [nhi.id])
      const tokens = await finish(opts, started)
      assert.equal((jwt.decode(tokens.access_token) as jwt.JwtPayload).sub, nhi.id)
    } finally {
      await testEnvAx.patch('/config', { depAdminIsOrgAdmin: false })
    }
  })

  test('an ip bound nhi gets tokens bound to the ip of each token request', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ name: 'Ip bound agent', ipBinding: true })
    const opts = dynamicFlow()
    const started = await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))
    assert.ok(started.details.nhis[org.id].some((n: any) => n.id === nhi.id))
    const tokens = await finish(opts, started, { 'x-forwarded-for': '9.9.9.5' })
    assert.equal((jwt.decode(tokens.access_token) as jwt.JwtPayload).boundIp, '9.9.9.5')

    // usable from that address (the mcp server relays the caller ip), refused from any other
    const call = (ip: string) => axios().get(`${issuer}/api/organizations/${org.id}`,
      { headers: { authorization: 'Bearer ' + tokens.access_token, 'x-forwarded-for': ip }, validateStatus: () => true })
    assert.equal((await call('9.9.9.5')).status, 200)
    assert.equal((await call('8.8.8.8')).status, 401)

    // a refresh binds the new token to the ip of the refresh
    const refreshed = await tokenRequest(issuer, {
      grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: dynamicClientId
    }, { 'x-forwarded-for': '9.9.9.6' })
    assert.equal(refreshed.status, 200, JSON.stringify(refreshed.data))
    assert.equal((jwt.decode(refreshed.data.access_token) as jwt.JwtPayload).boundIp, '9.9.9.6')
  })

  test('an nhi of another org cannot be bound', async () => {
    const { org, dynamicClientId, dynamicFlow } = await setupNhiConsent()
    const { ax: otherAx } = await createUser('oauth-nhi-other-owner@test.com')
    const otherOrg = (await otherAx.post('/api/organizations', { name: 'Other org' })).data
    otherAx.setOrg(otherOrg.id)
    const foreign = (await otherAx.post(`/api/organizations/${otherOrg.id}/nhis`, nhiBody({ subject: nhiSubject + '-foreign' }))).data
    const started = await decide(dynamicFlow(), () => ({ account: orgAccount(org), nhi: { id: foreign.id }, scopes: ['organizations:read'], lifetime: '30d' }))
    assert.equal(started.decided.status, 400, JSON.stringify(started.decided.data))
    assert.equal((await grantRecords({ clientId: dynamicClientId })).length, 0)
  })

  test('scopes wider than the nhi maximum are refused at the decision', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ scopes: ['organizations:read'] })
    const opts = dynamicFlow({ scope: 'organizations' })
    const started = await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations'], lifetime: '30d' }))
    assert.deepEqual(started.details.scopes.map((s: any) => s.name), ['organizations'])
    // an nhi that could be granted none of the requested scopes is not offered
    assert.ok(!started.details.nhis[org.id].some((n: any) => n.id === nhi.id))
    assert.equal(started.decided.status, 400, JSON.stringify(started.decided.data))
    // nor an empty scope, nor one that was not requested
    for (const scopes of [[], ['organizations:read'], 'organizations']) {
      const res = await postDecision(opts, started.uid, { decision: 'allow', account: orgAccount(org), nhi: { id: nhi.id }, scopes, lifetime: '30d' })
      assert.equal(res.status, 400, JSON.stringify(scopes))
    }
    // an unknown lifetime
    const nhiAll = await createNhi()
    const res = await postDecision(opts, started.uid, { decision: 'allow', account: orgAccount(org), nhi: { id: nhiAll.id }, scopes: ['organizations'], lifetime: '2y' })
    assert.equal(res.status, 400)
    assert.equal((await grantRecords({ clientId: dynamicClientId })).length, 0)
  })

  test('lifetime 7d sets the grant expiry', async () => {
    const { org, dynamicClientId, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi()
    const opts = dynamicFlow()
    await finish(opts, await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '7d' })))
    const records = await grantRecords({ clientId: dynamicClientId })
    assert.equal(records.length, 1)
    assert.ok(Math.abs(records[0].expiresAt.getTime() - Date.now() - 7 * 86400000) < 60000, String(records[0].expiresAt))
  })

  test('without a requested platform scope the known scopes are offered', async () => {
    const { org, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi({ scopes: ['organizations:read'] })
    const opts = dynamicFlow({ scope: undefined })
    const started = await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' }))
    assert.ok(started.details.scopes.some((s: any) => s.name === 'organizations:read'))
    const tokens = await finish(opts, started)
    assert.equal((jwt.decode(tokens.access_token) as jwt.JwtPayload).scope, 'organizations:read')
  })

  test('the same browser authorizes a user grant then an nhi grant', async () => {
    const { org, user, flow, dynamicFlow, createNhi } = await setupNhiConsent()
    const nhi = await createNhi()
    const first = await runCodeFlow(flow({ decision: { account: orgAccount(org) } }))
    assert.equal((jwt.decode(first.tokens.access_token) as jwt.JwtPayload).sub, user.id)
    const opts = dynamicFlow()
    const second = await finish(opts, await decide(opts, () => ({ account: orgAccount(org), nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d' })))
    assert.equal((jwt.decode(second.access_token) as jwt.JwtPayload).sub, nhi.id)
    // and back to the user
    const third = await runCodeFlow(flow({ decision: { account: orgAccount(org) } }))
    assert.equal((jwt.decode(third.tokens.access_token) as jwt.JwtPayload).sub, user.id)
  })
})
