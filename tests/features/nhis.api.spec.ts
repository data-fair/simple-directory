import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { axios, createUser, deleteAllEmails, testEnvAx, directoryUrl } from '../support/axios.ts'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }
const jwks = { keys: [publicJwk] }
const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' }) as string
const issuer = 'https://test-issuer.example.com'
const subject = 'system:serviceaccount:agents:my-agent'

// expected audience is the site origin, i.e. directoryUrl without the /simple-directory suffix
const audience = directoryUrl.replace('/simple-directory', '')
const signAssertion = (claims: Record<string, any> = {}, opts: jwt.SignOptions = {}) =>
  jwt.sign({ iss: issuer, sub: subject, aud: audience, ...claims }, privatePem,
    { algorithm: 'RS256', keyid: 'test-key', expiresIn: '10m', ...opts })

const nhiBody = (overrides: Record<string, any> = {}) => ({
  name: 'My agent', role: 'user', subject, provider: { issuer, jwks }, ...overrides
})

test.beforeEach(async () => {
  await deleteAllEmails()
  await testEnvAx.delete('/')
})

test('org admin manages NHIs, member listing excludes them by default', async () => {
  const { ax } = await createUser('nhi-admin@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org' })).data
  ax.setOrg(org.id)

  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  assert.ok(nhi.id.startsWith('nhi-'))
  assert.equal(nhi.name, 'My agent')

  const list = (await ax.get(`/api/organizations/${org.id}/nhis`)).data
  assert.equal(list.count, 1)
  assert.equal(list.results[0].subject, subject)

  // default member listing excludes NHIs
  const members = (await ax.get(`/api/organizations/${org.id}/members`)).data
  assert.equal(members.count, 1) // only the human admin
  // explicit types include them
  const nhiMembers = (await ax.get(`/api/organizations/${org.id}/members`, { params: { types: 'nhi' } })).data
  assert.equal(nhiMembers.count, 1)
  assert.equal(nhiMembers.results[0].id, nhi.id)

  await ax.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { name: 'Renamed agent', role: 'admin' })
  const patched = (await ax.get(`/api/organizations/${org.id}/nhis`)).data.results[0]
  assert.equal(patched.name, 'Renamed agent')
  assert.equal(patched.role, 'admin')

  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`)
  assert.equal((await ax.get(`/api/organizations/${org.id}/nhis`)).data.count, 0)
})

test('non-admin members cannot manage NHIs, bad role rejected', async () => {
  const { ax } = await createUser('nhi-admin2@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 2' })).data
  ax.setOrg(org.id)
  await assert.rejects(ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ role: 'nosuchrole' })), (err: any) => err.status === 400)
  const anonymous = axios()
  await assert.rejects(anonymous.post(`/api/organizations/${org.id}/nhis`, nhiBody()), (err: any) => err.status === 401 || err.status === 403)

  // a genuine authenticated non-admin (plain 'user' role) member is also forbidden
  const { ax: axMember } = await createUser('nhi-member2@test.com')
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })
  await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'nhi-member2@test.com', role: 'user' })
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: false })

  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  await assert.rejects(axMember.post(`/api/organizations/${org.id}/nhis`, nhiBody({ subject: subject + '-member' })), (err: any) => err.status === 403)
  await assert.rejects(axMember.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { name: 'renamed by member' }), (err: any) => err.status === 403)
  await assert.rejects(axMember.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`), (err: any) => err.status === 403)

  // belt-and-suspenders: test-env cleanup also sweeps nhi-* ids now, but delete
  // explicitly here too rather than relying on it.
  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`)
})

test('two NHIs can coexist in the same org (regression: email-less users must not collide on a unique index)', async () => {
  const { ax } = await createUser('nhi-admin3@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 3' })).data
  ax.setOrg(org.id)

  const nhi1 = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ subject: subject + '-1' }))).data
  const nhi2 = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ subject: subject + '-2' }))).data
  assert.notEqual(nhi1.id, nhi2.id)

  const list = (await ax.get(`/api/organizations/${org.id}/nhis`)).data
  assert.equal(list.count, 2)
  assert.deepEqual(list.results.map((r: any) => r.id).sort(), [nhi1.id, nhi2.id].sort())

  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi1.id}`)
  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi2.id}`)
  assert.equal((await ax.get(`/api/organizations/${org.id}/nhis`)).data.count, 0)
})

test('nhi token exchange issues a short-lived org session', async () => {
  const { ax } = await createUser('nhi-admin3@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 3' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data

  const agentAx = axios()
  const res = await agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion() })
  assert.equal(res.data.token_type, 'Bearer')
  assert.ok(res.data.expires_in > 0 && res.data.expires_in <= 10 * 60)
  const payload = jwt.decode(res.data.access_token) as any
  assert.equal(payload.nhi, 1)
  assert.equal(payload.id, nhi.id)
  assert.equal(payload.email, undefined)
  assert.equal(payload.isAdmin, undefined)
  assert.equal(payload.organizations.length, 1)
  assert.equal(payload.organizations[0].id, org.id)

  const cookies = res.headers['set-cookie']!.join(';')
  assert.ok(cookies.includes('id_token='))
  assert.ok(cookies.includes('id_token_org=' + org.id))
  assert.ok(!cookies.includes('id_token_ex='))

  // the session works against the API (cookie flow, same as a browser context would use)
  const me = await agentAx.get(`/api/organizations/${org.id}`, { headers: { cookie: res.headers['set-cookie']!.map(c => c.split(';')[0]).join('; ') } })
  assert.equal(me.data.id, org.id)

  // keepalive is structurally rejected: no exchange token
  await assert.rejects(agentAx.post('/api/auth/keepalive', null, { headers: { cookie: res.headers['set-cookie']!.map(c => c.split(';')[0]).join('; ') } }),
    (err: any) => err.status === 401)
})

test('nhi session exp is capped by the assertion exp', async () => {
  const { ax } = await createUser('nhi-admin4@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 4' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  const agentAx = axios()
  const res = await agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({}, { expiresIn: '30s' }) })
  assert.ok(res.data.expires_in <= 30)
})

test('nhi token exchange failures are a uniform 401', async () => {
  const { ax } = await createUser('nhi-admin5@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 5' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  const agentAx = axios()
  const is401 = (err: any) => err.status === 401
  await assert.rejects(agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({ sub: 'system:serviceaccount:agents:other' }) }), is401)
  await assert.rejects(agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({ aud: 'https://other.example.com' }) }), is401)
  await assert.rejects(agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({}, { expiresIn: '-1m' }) }), is401)
  await assert.rejects(agentAx.post('/api/auth/nhi-token', { client_id: 'nhi-unknown000', assertion: signAssertion() }), is401)
  // a human user id is not exchangeable
  const { user: humanUser } = await createUser('human@test.com')
  await assert.rejects(agentAx.post('/api/auth/nhi-token', { client_id: humanUser.id, assertion: signAssertion() }), is401)
})
