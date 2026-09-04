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
  // NHIs carry a deterministic synthetic email derived from the public URL host, stored on the
  // record (so downstream email-keyed permission filters always see a real value) — the payload
  // reflecting it proves it is stored, not fabricated at token time.
  const publicHost = new URL((await getServerConfig()).publicUrl).hostname
  assert.equal(payload.email, `${nhi.id}@nhi.${publicHost}`)
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

  // keepalive is inert, not destructive: it cannot renew the session (no exchange token exists)
  // but it must not log it out either. Every SPA in the stack keepalives on page load, so a
  // logout here would destroy the session on the NHI's first page view — see the guard in
  // tokens/service.ts. It must answer 204 and leave the cookies alone.
  const nhiCookie = res.headers['set-cookie']!.map(c => c.split(';')[0]).join('; ')
  const ka = await agentAx.post('/api/auth/keepalive', null, { headers: { cookie: nhiCookie } })
  assert.equal(ka.status, 204)
  for (const c of ka.headers['set-cookie'] ?? []) {
    assert.ok(!/^id_token(_sign|_org)?=(;|$)/.test(c), `keepalive must not clear ${c.split('=')[0]}`)
  }
  // and the session still works afterwards — the real regression this guards against
  const after = await agentAx.get(`/api/organizations/${org.id}`, { headers: { cookie: nhiCookie } })
  assert.equal(after.data.id, org.id)
})

// Count near-white pixels in the bottom-right badge region ([72,98) on both axes) of a
// 100x100 avatar PNG. The robot badge is a white glyph composited at +68+68, so its body
// lands squarely in this region; a human initials avatar keeps it in plain background color
// (initials are centered and never reach the corner).
const whiteBadgePixels = async (png: Buffer) => {
  const gm = (await import('gm')).default
  const ppm: Buffer = await new Promise((resolve, reject) => {
    gm(png).toBuffer('PPM', (err, buf) => err ? reject(err) : resolve(buf))
  })
  // P6 header: "P6 <width> <height> <maxval>" as whitespace-separated ASCII, then binary RGB.
  // A Q16 GraphicsMagick build emits maxval 65535 with 2 bytes per sample (big-endian).
  const header = ppm.subarray(0, 32).toString('latin1')
  const m = header.match(/^P6\s+(\d+)\s+(\d+)\s+(\d+)\s/)
  if (!m) throw new Error('unexpected PPM header: ' + header)
  const [, w, h, maxval] = m.map(Number)
  const data = ppm.subarray(m[0].length)
  const bps = maxval > 255 ? 2 : 1
  const sample = (x: number, y: number, c: number) => bps === 2 ? data.readUInt16BE(((y * w + x) * 3 + c) * 2) : data[(y * w + x) * 3 + c]
  let count = 0
  for (let y = 72; y < Math.min(98, h); y++) {
    for (let x = 72; x < Math.min(98, w); x++) {
      if (sample(x, y, 0) >= maxval * 0.94 && sample(x, y, 1) >= maxval * 0.94 && sample(x, y, 2) >= maxval * 0.94) count++
    }
  }
  return count
}

test('nhi automatic avatar carries a robot badge', async () => {
  const { ax, user } = await createUser('nhi-avatar@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI avatar org' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data

  const nhiRes = await ax.get(`/api/avatars/user/${nhi.id}/avatar.png`, { responseType: 'arraybuffer' })
  assert.equal(nhiRes.headers['content-type'], 'image/png')
  const nhiWhite = await whiteBadgePixels(Buffer.from(nhiRes.data))
  assert.ok(nhiWhite > 40, `expected a white robot badge in the corner, found ${nhiWhite} white pixels`)

  const humanRes = await ax.get(`/api/avatars/user/${user.id}/avatar.png`, { responseType: 'arraybuffer' })
  const humanWhite = await whiteBadgePixels(Buffer.from(humanRes.data))
  assert.ok(humanWhite < 5, `human avatar must not carry the badge, found ${humanWhite} white pixels in the corner`)
})

test('an NHI is excluded from email-based auth despite its stored synthetic email', async () => {
  const { ax } = await createUser('nhi-admin-authpath@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI authpath org' })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  const publicHost = new URL((await getServerConfig()).publicUrl).hostname
  const nhiEmail = `${nhi.id}@nhi.${publicHost}`
  // getUserByEmail excludes NHIs, so their stored email is never an authentication path:
  // a password login using it is rejected as unknown credentials, minting no session
  const anon = axios()
  await assert.rejects(anon.post('/api/auth/password', { email: nhiEmail, password: 'irrelevant' }), (err: any) => err.status === 400)
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
  // authenticated callers bypass the anti-bot token on user self-registration, so the guard here
  // is load-bearing, not just belt-and-suspenders
  await assert.rejects(nhiAx.post('/api/users', { email: 'nhi-self-register@test.com', password: 'TestPasswd01' }), is403)
  // the members route is not the sanctioned surface for NHI role changes (the nhis PATCH route is)
  await assert.rejects(nhiAx.patch(`/api/organizations/${org.id}/members/${nhi.id}`, { role: 'user' }), is403)
  // guard fires before any plannedDeletion state check, so no superadmin setup is needed here
  await assert.rejects(nhiAx.delete(`/api/users/${nhi.id}/plannedDeletion`), is403)
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

test('nhi provider is validated at create and patch time', async () => {
  const { ax } = await createUser('nhi-admin-validate@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI validate org' })).data
  ax.setOrg(org.id)
  const is400 = (err: any) => err.status === 400

  // malformed issuer url is rejected even where insecure issuers are allowed (dev/test)
  await assert.rejects(ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ provider: { issuer: 'not a url', jwks } })), is400)
  // inline jwks that jose cannot parse as a JWKS
  await assert.rejects(ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ provider: { issuer, jwks: { keys: 'garbage' } } })), is400)
  // no inline jwks and unreachable issuer -> discovery must fail fast at creation
  await assert.rejects(ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ provider: { issuer: 'https://issuer-does-not-exist.invalid' } })), is400)

  // discovery happy path against the dev mock OIDC provider
  const mockIssuer = `http://localhost:${process.env.MOCK_OIDC_PORT1 || '8998'}`
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ provider: { issuer: mockIssuer } }))).data
  assert.equal(nhi.nhi.provider.issuer, mockIssuer)

  // patch with a broken provider is rejected, and the record is left unchanged
  await assert.rejects(ax.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { provider: { issuer, jwks: { keys: 'garbage' } } }), is400)
  const unchanged = (await ax.get(`/api/organizations/${org.id}/nhis`)).data.results.find((r: any) => r.id === nhi.id)
  assert.equal(unchanged.provider.issuer, mockIssuer)
  // patch that does not touch the provider performs no provider validation
  await ax.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { name: 'Renamed validated agent' })
})
