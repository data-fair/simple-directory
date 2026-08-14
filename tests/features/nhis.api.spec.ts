import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { axios, createUser, deleteAllEmails, testEnvAx, directoryUrl, getServerConfig } from '../support/axios.ts'

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

  const setCookieHeaders = res.headers['set-cookie']!
  const cookies = setCookieHeaders.join(';')
  assert.ok(cookies.includes('id_token='))
  assert.ok(cookies.includes('id_token_org=' + org.id))
  // a stale id_token_ex cookie (e.g. left over from a prior human session in the same browser)
  // is actively cleared (empty deletion cookie), but no new SIGNED exchange token is ever issued
  const idTokenExHeader = setCookieHeaders.find(c => c.startsWith('id_token_ex='))
  assert.ok(idTokenExHeader, 'expected an id_token_ex clearing cookie')
  assert.equal(idTokenExHeader!.split(';')[0], 'id_token_ex=')

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

test('nhi session exp is also capped by jwtDurations.nhiToken', async () => {
  // asserted against the running server's effective config (already in seconds) so the test
  // stays correct if the dev/test config ever overrides the default 30m nhiToken duration
  const nhiTokenSeconds = (await getServerConfig()).jwtDurations.nhiToken
  assert.ok(nhiTokenSeconds > 0)
  const { ax } = await createUser('nhi-admin4b@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 4b' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  const agentAx = axios()
  const res = await agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion({}, { expiresIn: '2h' }) })
  assert.ok(res.data.expires_in <= nhiTokenSeconds)
})

test('nhi token exchange is scoped to the main site and to sites owned by the nhi org', async () => {
  const config = await getServerConfig()
  const { ax } = await createUser('nhi-admin6@test.com')
  const orgA = (await ax.post('/api/organizations', { name: 'NHI org 6a' })).data
  const orgB = (await ax.post('/api/organizations', { name: 'NHI org 6b' })).data
  ax.setOrg(orgA.id)
  const nhi = (await ax.post(`/api/organizations/${orgA.id}/nhis`, nhiBody())).data

  const siteAHost = `127.0.0.1:${process.env.NGINX_PORT2}`
  const siteBHost = `127.0.0.1:${process.env.NGINX_PORT3}`
  const anonymousAx = axios()
  await anonymousAx.post('/api/sites',
    { _id: 'test_nhi_site_a', owner: { type: 'organization', id: orgA.id, name: orgA.name }, host: siteAHost },
    { params: { key: config.secretKeys.sites } })
  await anonymousAx.post('/api/sites',
    { _id: 'test_nhi_site_b', owner: { type: 'organization', id: orgB.id, name: orgB.name }, host: siteBHost },
    { params: { key: config.secretKeys.sites } })
  await testEnvAx.post('/clear-site-cache')

  const agentAx = axios()
  // a site owned by another organization cannot mint a session for this NHI (same uniform 401)
  await assert.rejects(agentAx.post(`http://${siteBHost}/simple-directory/api/auth/nhi-token`,
    { client_id: nhi.id, assertion: signAssertion({ aud: `http://${siteBHost}` }) }), (err: any) => err.status === 401)

  // a site owned by the NHI's own organization is accepted
  const res = await agentAx.post(`http://${siteAHost}/simple-directory/api/auth/nhi-token`,
    { client_id: nhi.id, assertion: signAssertion({ aud: `http://${siteAHost}` }) })
  assert.equal(res.data.token_type, 'Bearer')
  const payload = jwt.decode(res.data.access_token) as any
  assert.equal(payload.id, nhi.id)
  assert.equal(payload.siteOwner.type, 'organization')
  assert.equal(payload.siteOwner.id, orgA.id)
})

// creates a human org admin, an NHI in that org, and exchanges the NHI a session — returns an
// axios instance carrying the NHI session cookies alongside the created nhi/org and the admin's ax
const nhiSession = async (adminEmail: string, orgName: string) => {
  const { ax } = await createUser(adminEmail)
  const org = (await ax.post('/api/organizations', { name: orgName })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ role: 'admin' }))).data
  const agentAx = axios()
  const res = await agentAx.post('/api/auth/nhi-token', { client_id: nhi.id, assertion: signAssertion() })
  const cookie = res.headers['set-cookie']!.map((c: string) => c.split(';')[0]).join('; ')
  const nhiAx = axios({ headers: { cookie } })
  return { nhiAx, nhi, org, adminAx: ax }
}

test('nhi sessions are rejected on self-management, invitations, org creation and 2FA', async () => {
  const { nhiAx, nhi, org } = await nhiSession('nhi-admin6@test.com', 'NHI org 6')
  const is403 = (err: any) => err.status === 403
  await assert.rejects(nhiAx.patch(`/api/users/${nhi.id}`, { firstName: 'Hack' }), is403)
  await assert.rejects(nhiAx.delete(`/api/users/${nhi.id}`), is403)
  await assert.rejects(nhiAx.post('/api/invitations', { id: org.id, name: org.name, email: 'invited@test.com', role: 'user' }), is403)
  await assert.rejects(nhiAx.post('/api/organizations', { name: 'Escaped org' }), is403)
  await assert.rejects(nhiAx.post('/api/2fa', { email: 'invited@test.com', password: 'TestPasswd01' }), is403)
})

test('superadmin flows exclude NHIs', async () => {
  const { nhi } = await nhiSession('nhi-admin7@test.com', 'NHI org 7')
  const { ax: superAx } = await createUser('admin@test.com', true)
  await assert.rejects(superAx.post('/api/auth/asadmin', { id: nhi.id }), (err: any) => err.status === 403)
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
