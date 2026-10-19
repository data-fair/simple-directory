import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { axios, testEnvAx, getServerConfig } from '../support/axios.ts'
import { runCodeFlow, tokenRequest } from '../support/oauth-client.ts'
import { issuer, siteId, withMongo, grantRecords, setup, patchClient } from '../support/oauth-code-site.ts'

const refresh = (clientId: string, refreshToken: string, extra: Record<string, string | undefined> = {}, headers: Record<string, string> = {}) =>
  tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, ...extra }, headers)

const revoke = (params: Record<string, string>, headers: Record<string, string> = {}) =>
  axios().post(issuer + '/api/oauth/revoke', new URLSearchParams(params).toString(),
    { headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, validateStatus: () => true })

const assertInvalidGrant = (res: { status: number, data: any }, label: string) => {
  assert.equal(res.status, 400, `${label}: ${JSON.stringify(res.data)}`)
  assert.equal(res.data.error, 'invalid_grant', `${label}: ${JSON.stringify(res.data)}`)
}

const decode = (token: string) => jwt.decode(token) as jwt.JwtPayload

test.describe('oauth refresh tokens and revocation', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('refresh rotates the token and rebuilds claims', async () => {
    const { org, user, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow({ decision: { account: { type: 'organization', id: org.id } } }))
    const [afterCode] = await grantRecords({ clientId })
    assert.ok(afterCode.lastUsedAt instanceof Date, 'the code exchange records the use of the grant')

    const res = await refresh(clientId, tokens.refresh_token)
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.ok(res.data.refresh_token)
    assert.notEqual(res.data.refresh_token, tokens.refresh_token)
    assert.equal(res.data.scope, 'organizations:read')
    const payload = decode(res.data.access_token)
    assert.equal(payload.sub, user.id)
    assert.equal(payload.client_id, clientId)
    assert.equal(payload.scope, 'organizations:read')
    assert.deepEqual(payload.organizations.map((o: any) => o.id), [org.id])
    for (const key of ['isAdmin', 'adminMode', 'asAdmin']) assert.equal(payload[key], undefined, key)

    const [afterRefresh] = await grantRecords({ clientId })
    assert.ok(afterRefresh.lastUsedAt.getTime() >= afterCode.lastUsedAt.getTime())
  })

  test('a refresh with a narrower scope parameter gets the narrower scope', async () => {
    const { clientId, flow } = await setup({ scopes: ['organizations:read', 'organizations'] })
    const { tokens } = await runCodeFlow(flow({ scope: 'organizations:read organizations' }))
    assert.equal(decode(tokens.access_token).scope, 'organizations:read organizations')
    const res = await refresh(clientId, tokens.refresh_token, { scope: 'organizations:read' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.scope, 'organizations:read')
    assert.equal(decode(res.data.access_token).scope, 'organizations:read')
    // the grant itself is unchanged, the next refresh without scope gets everything back
    const full = await refresh(clientId, res.data.refresh_token)
    assert.equal(full.status, 200, JSON.stringify(full.data))
    assert.equal(decode(full.data.access_token).scope, 'organizations:read organizations')
    // a scope outside the grant is refused by the provider
    const wider = await refresh(clientId, full.data.refresh_token, { scope: 'organizations:read datasets:read' })
    assert.equal(wider.status, 400, JSON.stringify(wider.data))
    assert.equal(wider.data.error, 'invalid_scope')
  })

  test('refresh reuse revokes the grant', async () => {
    const { clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    const second = await refresh(clientId, tokens.refresh_token)
    assert.equal(second.status, 200, JSON.stringify(second.data))
    assertInvalidGrant(await refresh(clientId, tokens.refresh_token), 'reuse of the first token')
    assertInvalidGrant(await refresh(clientId, second.data.refresh_token), 'the newest token after the reuse')
    assert.equal((await grantRecords({ clientId })).length, 0)
  })

  test('losing the membership fails the refresh', async () => {
    const { org, user, adminAx, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow({ decision: { account: { type: 'organization', id: org.id } } }))
    await adminAx.delete(`/api/organizations/${org.id}/members/${user.id}`, { params: { role: 'user' } })
    assertInvalidGrant(await refresh(clientId, tokens.refresh_token), 'refresh without the membership')
  })

  test('a narrowed site client narrows the refreshed scope', async () => {
    const { adminAx, clientId, flow } = await setup({ scopes: ['organizations:read', 'organizations'] })
    const { tokens } = await runCodeFlow(flow({ scope: 'organizations:read organizations' }))
    await patchClient(adminAx, clientId, { scopes: ['organizations:read'] })
    const narrowed = await refresh(clientId, tokens.refresh_token)
    assert.equal(narrowed.status, 200, JSON.stringify(narrowed.data))
    assert.equal(narrowed.data.scope, 'organizations:read')
    assert.equal(decode(narrowed.data.access_token).scope, 'organizations:read')
    // no known scope outside the organizations family: written in the site document directly
    await withMongo(db => db.collection<any>('sites').updateOne({ _id: siteId }, { $set: { 'oauthClients.0.scopes': ['other:x'] } }))
    await testEnvAx.post('/clear-site-cache')
    assertInvalidGrant(await refresh(clientId, narrowed.data.refresh_token), 'refresh with no scope left')
  })

  test('revocation endpoint revokes the grant', async () => {
    const { clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    const res = await revoke({ token: tokens.refresh_token, client_id: clientId })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assertInvalidGrant(await refresh(clientId, tokens.refresh_token), 'refresh after revocation')
    assert.equal((await grantRecords({ clientId })).length, 0)
  })

  test('revoking a jwt access token is unsupported_token_type', async () => {
    const { clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    const res = await revoke({ token: tokens.access_token, client_id: clientId })
    assert.equal(res.status, 400, JSON.stringify(res.data))
    assert.equal(res.data.error, 'unsupported_token_type')
    // documented gap: the grant lives on
    assert.equal((await grantRecords({ clientId })).length, 1)
  })

  test('cors on the token endpoint follows allowedOrigins', async () => {
    const { clientId, flow } = await setup({ redirectUris: ['http://localhost:5999/cb', 'https://dash.example.org/cb'] })
    const { tokens } = await runCodeFlow(flow())
    const allowed = await refresh(clientId, tokens.refresh_token, {}, { origin: 'https://dash.example.org' })
    assert.equal(allowed.status, 200, JSON.stringify(allowed.data))
    assert.equal(allowed.headers['access-control-allow-origin'], 'https://dash.example.org')
    const refused = await refresh(clientId, allowed.data.refresh_token, {}, { origin: 'https://evil.example.org' })
    assert.equal(refused.status, 400, JSON.stringify(refused.data))
    assert.equal(refused.data.error, 'invalid_request')
    assert.equal(refused.headers['access-control-allow-origin'], undefined)
    // the revocation endpoint follows the same rule
    const revokeRefused = await revoke({ token: allowed.data.refresh_token, client_id: clientId }, { origin: 'https://evil.example.org' })
    assert.equal(revokeRefused.status, 400, JSON.stringify(revokeRefused.data))
    assert.equal((await grantRecords({ clientId })).length, 1)
  })

  test('deleting the user revokes their grants', async () => {
    const { user, adminAx, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    assert.equal((await grantRecords({ 'subject.id': user.id })).length, 1)
    await adminAx.delete('/api/users/' + user.id)
    assert.equal((await grantRecords({ 'subject.id': user.id })).length, 0)
    assert.equal(await withMongo(db => db.collection('oauth-refresh-token').countDocuments({ 'payload.accountId': user.id })), 0)
    assertInvalidGrant(await refresh(clientId, tokens.refresh_token), 'refresh after the deletion')
  })

  test('failed refreshes are rate limited per client', async () => {
    const { clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    const attempts = (await getServerConfig()).authRateLimit.attempts
    // a new address for every request: only the client_id key accumulates
    let n = 0
    const from = () => { n++; return { 'x-forwarded-for': `10.77.${n >> 8}.${n & 255}` } }
    for (let i = 0; i < attempts - 1; i++) {
      assertInvalidGrant(await refresh(clientId, 'bogus-' + i, {}, from()), `failure ${i}`)
    }
    // a success gives its point back
    const ok = await refresh(clientId, tokens.refresh_token, {}, from())
    assert.equal(ok.status, 200, JSON.stringify(ok.data))
    assertInvalidGrant(await refresh(clientId, 'bogus-last', {}, from()), 'last failure within the budget')
    const limited = await refresh(clientId, ok.data.refresh_token, {}, from())
    assert.equal(limited.status, 429, JSON.stringify(limited.data))
    assert.equal(limited.data.error, 'invalid_request')
  })
})
