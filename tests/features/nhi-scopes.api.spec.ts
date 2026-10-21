import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { axios, createUser, deleteAllEmails, testEnvAx, directoryUrl, devApiUrl, getServerConfig } from '../support/axios.ts'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }] }
const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' }) as string
const issuer = 'https://test-issuer.example.com'
const audience = directoryUrl.replace('/simple-directory', '')

const scopedNhi = async (email: string, scopes?: string[], extra: Record<string, any> = {}) => {
  const { ax } = await createUser(email)
  const org = (await ax.post('/api/organizations', { name: 'Scoped ' + email })).data
  ax.setOrg(org.id)
  const subject = 'scoped:' + email
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, { name: 'Scoped agent', role: 'admin', subject, provider: { issuer, jwks }, scopes, ...extra })).data
  const assertion = jwt.sign({ iss: issuer, sub: subject, aud: audience }, privatePem, { algorithm: 'RS256', keyid: 'test-key', expiresIn: '10m' })
  const res = await axios().post('/api/auth/nhi-token', { client_id: nhi.id, assertion })
  const cookie = res.headers['set-cookie']!.map((c: string) => c.split(';')[0]).join('; ')
  return {
    org,
    nhi,
    cookieAx: axios({ headers: { cookie } }),
    bearerAx: axios({ headers: { authorization: 'Bearer ' + res.data.access_token } }),
    cookie
  }
}

test.beforeEach(async () => {
  await deleteAllEmails()
  await testEnvAx.delete('/')
  // datasets:read must be a listed scope to be stored on an NHI
  await testEnvAx.patch('/config', { platformScopesUrl: `${devApiUrl}/api/test-env/platform-scopes` })
  await testEnvAx.put('/platform-scopes', { scopes: { 'datasets:read': 'Read datasets' } })
})

test.afterAll(async () => {
  await testEnvAx.patch('/config', { platformScopesUrl: '' })
})

test('a scoped NHI reads its organization through the gated routes, cookie or bearer', async () => {
  const { org, cookieAx, bearerAx } = await scopedNhi('nhi-gate1@test.com', ['organizations:read'])
  for (const ax of [cookieAx, bearerAx]) {
    assert.equal((await ax.get(`/api/organizations/${org.id}`)).data.id, org.id)
    assert.ok((await ax.get(`/api/organizations/${org.id}/members`)).data.count >= 1)
    assert.ok(Array.isArray((await ax.get(`/api/organizations/${org.id}/roles`)).data))
    assert.ok((await ax.get('/api/organizations', { params: { 'is-member': true } })).data.count >= 1)
  }
})

test('a scoped NHI with the admin role is refused outside the gate', async () => {
  const { org, nhi, cookieAx, bearerAx } = await scopedNhi('nhi-gate2@test.com', ['organizations'])
  const is403 = (err: any) => err.status === 403
  for (const ax of [cookieAx, bearerAx]) {
    await assert.rejects(ax.patch(`/api/organizations/${org.id}`, { description: 'changed' }), is403)
    await assert.rejects(ax.get(`/api/users/${nhi.id}`), is403)
    await assert.rejects(ax.get(`/api/organizations/${org.id}/nhis`), is403)
  }
})

test('a scope that does not cover organizations reads nothing in SD', async () => {
  const { org, cookieAx } = await scopedNhi('nhi-gate3@test.com', ['datasets:read'])
  const { bearerAx } = await scopedNhi('nhi-gate3b@test.com', ['datasets:read'])
  const is403 = (err: any) => err.status === 403
  await assert.rejects(cookieAx.get(`/api/organizations/${org.id}`), is403)
  await assert.rejects(cookieAx.get('/api/accounts'), is403)
  await assert.rejects(bearerAx.get('/api/organizations'), is403)
  await assert.rejects(bearerAx.get('/api/accounts'), is403)
})

// the agents service lists an agent's portals as the agent itself, whatever its scopes
test('a scoped NHI session lists its organization\'s sites', async () => {
  const { org, cookieAx, bearerAx } = await scopedNhi('nhi-gate5@test.com', ['datasets:read'])
  const config = await getServerConfig()
  await axios().post('/api/sites',
    { _id: 'test_scoped_sites', owner: { type: 'organization', id: org.id, name: org.name }, host: 'scoped-sites.example.com', theme: { primaryColor: '#FF0000' } },
    { params: { key: config.secretKeys.sites } })
  for (const ax of [cookieAx, bearerAx]) {
    const { data } = await ax.get('/api/sites', { params: { owner: `organization:${org.id}`, tmp: false } })
    assert.deepEqual(data.results.map((s: any) => s.host), ['scoped-sites.example.com'])
  }
})

test('a scoped NHI session is refused another organization\'s sites', async () => {
  const { cookieAx } = await scopedNhi('nhi-gate6@test.com', ['datasets:read'])
  const { org: other } = await scopedNhi('nhi-gate6b@test.com', ['datasets:read'])
  const is403 = (err: any) => err.status === 403
  await assert.rejects(cookieAx.get('/api/sites', { params: { owner: `organization:${other.id}` } }), is403)
  await assert.rejects(cookieAx.get('/api/sites', { params: { showAll: true } }), is403)
})

test('keepalive stays inert for a scoped NHI session', async () => {
  const { org, cookie, cookieAx } = await scopedNhi('nhi-gate4@test.com', ['organizations:read'])
  const ka = await axios({ headers: { cookie } }).post('/api/auth/keepalive', null)
  assert.equal(ka.status, 204)
  assert.equal((await cookieAx.get(`/api/organizations/${org.id}`)).data.id, org.id)
})

test('the gate matches paths case-insensitively', async () => {
  // the dev nginx sends uppercase paths to the UI, express itself routes them to the API:
  // hit the API port directly
  const { org, nhi, bearerAx, cookie } = await scopedNhi('nhi-gate7@test.com', ['organizations'])
  const is403 = (err: any) => err.status === 403
  const bearer = String((bearerAx.defaults.headers as any).authorization ?? (bearerAx.defaults.headers as any).common?.authorization)
  for (const headers of [{ authorization: bearer }, { cookie }]) {
    const direct = axios({ baseURL: devApiUrl, headers })
    await assert.rejects(direct.get(`/API/organizations/${org.id}/nhis`), is403)
    await assert.rejects(direct.get(`/Api/users/${nhi.id}`), is403)
  }
})

test('a scoped session can log out without trailing slash but reaches no other auth route', async () => {
  const { cookie } = await scopedNhi('nhi-gate8@test.com', ['organizations:read'])
  const ax = axios({ headers: { cookie } })
  await assert.rejects(ax.delete('/api/auth/adminmode'), (err: any) => err.status === 403)
  assert.equal((await ax.delete('/api/auth')).status, 204)
})

test('an NHI cannot mint a renewable session through token_callback', async () => {
  const { cookie } = await scopedNhi('nhi-gate9@test.com', undefined, { ipBinding: true })
  const cookies = Object.fromEntries(cookie.split('; ').map(c => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)]))
  assert.ok(cookies.id_token && cookies.id_token_sign)
  const res = await axios().get('/api/auth/token_callback', {
    params: { id_token: cookies.id_token + '.' + cookies.id_token_sign },
    validateStatus: () => true
  })
  assert.equal(res.status, 403)
  assert.ok(!(res.headers['set-cookie'] ?? []).some((c: string) => c.startsWith('id_token_ex=')))
})
