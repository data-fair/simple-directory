import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { axios, axiosAuth, createUser, deleteAllEmails, testEnvAx, devApiUrl } from '../support/axios.ts'
import { CookieJar } from 'tough-cookie'

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }] }
const issuer = 'https://test-issuer.example.com'

const nowSec = () => Math.floor(Date.now() / 1000)

const createNhi = async (email: string) => {
  const { ax } = await createUser(email)
  const org = (await ax.post('/api/organizations', { name: 'Pseudo ' + email })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, { name: 'Pseudo agent', role: 'admin', subject: 'pseudo:' + email, provider: { issuer, jwks } })).data
  return { org, nhi }
}

const cookieAxFrom = (res: any) => axios({ headers: { cookie: (res.headers['set-cookie'] as string[]).map(c => c.split(';')[0]).join('; ') } })

const ax = await axios({ baseURL: devApiUrl })

test.describe('Pseudo session', () => {
  test.beforeEach(async () => {
    await deleteAllEmails()
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Create pseudo session for a user', async () => {
    const res = await ax.post('/api/auth/pseudo?key=testkey', {
      type: 'user',
      id: 'test_dmeadus0'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.pseudoSession, true)
    assert.equal(res.data.user.id, 'test_dmeadus0')

    const cookies = res.headers['set-cookie'] as string[]
    assert.ok(cookies)
    const cookieJar = new CookieJar()
    for (const cookie of cookies) {
      cookieJar.setCookie(cookie, 'http://localhost')
    }
    const sessionCookie = await cookieJar.getCookieString('http://localhost')
    assert.ok(sessionCookie.includes('id_token='))
    assert.ok(sessionCookie.includes('id_token_sign='))
    assert.ok(!sessionCookie.includes('id_token_ex='))

    const cookieString = await cookieJar.getCookieString('http://localhost')
    const authenticatedAx = await axios()
    authenticatedAx.defaults.headers.Cookie = cookieString

    const meRes = await authenticatedAx.get('/api/auth/me')
    assert.equal(meRes.status, 200)
    assert.equal(meRes.data.id, 'test_dmeadus0')
    assert.equal(meRes.data.email, 'dmeadus0@answers.com')
  })

  test('Bounded pseudo session for an NHI', async () => {
    const { org, nhi } = await createNhi('pseudo-nhi1@test.com')
    const exp = nowSec() + 60
    const res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: nhi.id, exp })
    assert.equal(res.status, 200)
    assert.equal(res.data.pseudoSession, true)
    assert.equal(res.data.exp, exp)
    const cookies = res.headers['set-cookie'] as string[]
    assert.ok(!cookies.some(c => /^id_token_ex=[^;]/.test(c)))
    const idToken = cookies.find(c => c.startsWith('id_token='))!.split(';')[0].split('=')[1]
    const sign = cookies.find(c => c.startsWith('id_token_sign='))!.split(';')[0].split('=')[1]
    const decoded = jwt.decode(idToken + '.' + sign) as any
    assert.ok(decoded.exp <= exp)
    assert.equal(decoded.scope, undefined)

    const me = (await cookieAxFrom(res).get('/api/auth/me')).data
    assert.equal(me.id, nhi.id)
    // the active account is carried by the id_token_org cookie, read by the services
    assert.deepEqual(me.organizations.map((o: any) => o.id), [org.id])
    assert.ok(cookies.some(c => c.startsWith(`id_token_org=${org.id};`)))

    const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    const user = (await adminAx.get(`/api/users/${nhi.id}`)).data
    assert.equal((user.sessions ?? []).length, 0)
  })

  test('Pseudo session exp is capped by the id_token duration', async () => {
    const { nhi } = await createNhi('pseudo-nhi2@test.com')
    const res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: nhi.id, exp: nowSec() + 10 * 365 * 86400 })
    assert.equal(res.status, 200)
    // jwtDurations.idToken: 15m by default
    const idTokenDuration = 15 * 60
    const before = nowSec()
    assert.ok(res.data.exp <= before + idTokenDuration + 5)
    const cookies = res.headers['set-cookie'] as string[]
    const idToken = cookies.find(c => c.startsWith('id_token='))!.split(';')[0].split('=')[1]
    const sign = cookies.find(c => c.startsWith('id_token_sign='))!.split(';')[0].split('=')[1]
    const decoded = jwt.decode(idToken + '.' + sign) as any
    assert.ok(decoded.exp <= before + idTokenDuration + 5)
    assert.ok(decoded.exp > before)
  })

  test('An NHI pseudo session requires exp', async () => {
    const { nhi } = await createNhi('pseudo-nhi3@test.com')
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: nhi.id }), { status: 400 })
  })

  test('A pseudo session exp in the past is refused', async () => {
    const { nhi } = await createNhi('pseudo-nhi4@test.com')
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: nhi.id, exp: nowSec() - 10 }), { status: 400 })
  })

  test('A human pseudo session accepts a bounded exp', async () => {
    const exp = nowSec() + 120
    const res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: 'test_dmeadus0', exp })
    assert.equal(res.status, 200)
    assert.equal(res.data.exp, exp)
    const cookies = res.headers['set-cookie'] as string[]
    assert.ok(!cookies.some(c => /^id_token_ex=[^;]/.test(c)))
  })

  test('A non-integer exp is refused', async () => {
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: 'test_dmeadus0', exp: nowSec() + 60.5 }), { status: 400 })
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: 'test_dmeadus0', exp: String(nowSec() + 60) }), { status: 400 })
  })

  test('Pseudo session matches the department of the membership exactly', async () => {
    const { ax: userAx } = await createUser('pseudo-dep@test.com')
    const org = (await userAx.post('/api/organizations', { name: 'Pseudo dep org', departments: [{ id: 'dep1', name: 'Dep 1' }] })).data
    const user = (await userAx.get('/api/auth/me')).data
    await testEnvAx.patch('/user/pseudo-dep@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }, { id: org.id, name: org.name, role: 'user', department: 'dep1', departmentName: 'Dep 1' }] })

    // root membership when no department is given
    let res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: org.id })
    let cookies = res.headers['set-cookie'] as string[]
    assert.ok(cookies.some(c => c.startsWith(`id_token_org=${org.id};`)))
    assert.ok(!cookies.some(c => c.startsWith('id_token_dep=dep1')))

    res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: org.id, department: 'dep1' })
    cookies = res.headers['set-cookie'] as string[]
    assert.ok(cookies.some(c => c.startsWith('id_token_dep=dep1')))

    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: org.id, department: 'dep2' }), { status: 400 })
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, department: 'dep1' }), { status: 400 })

    // only a department membership: no root one to fall back to
    await testEnvAx.patch('/user/pseudo-dep@test.com', { organizations: [{ id: org.id, name: org.name, role: 'user', department: 'dep1', departmentName: 'Dep 1' }] })
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: org.id }), { status: 400 })
  })

  test('A non-human identity without organization is refused', async () => {
    const { nhi } = await createNhi('pseudo-nhi5@test.com')
    await testEnvAx.patch('/user/' + nhi.email, { organizations: [] })
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: nhi.id, exp: nowSec() + 60 }), { status: 400 })
  })

  test('Pseudo session for a user picks the requested organization', async () => {
    const { ax: userAx } = await createUser('pseudo-human@test.com')
    const org1 = (await userAx.post('/api/organizations', { name: 'Pseudo org 1' })).data
    const org2 = (await userAx.post('/api/organizations', { name: 'Pseudo org 2' })).data
    const user = (await userAx.get('/api/auth/me')).data
    const res = await ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: org2.id })
    assert.equal(res.status, 200)
    const me = (await cookieAxFrom(res).get('/api/auth/me')).data
    assert.equal(me.id, user.id)
    const cookies = res.headers['set-cookie'] as string[]
    assert.ok(cookies.some(c => c.startsWith(`id_token_org=${org2.id};`)))
    assert.ok(!cookies.some(c => c.startsWith(`id_token_org=${org1.id};`)))
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: user.id, organization: 'test_KWqAGZ4mG' }), { status: 400 })
  })

  test('Create pseudo session for an organization', async () => {
    const res = await ax.post('/api/auth/pseudo?key=testkey', {
      type: 'organization',
      id: 'test_KWqAGZ4mG',
      role: 'admin'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.pseudoSession, true)
    assert.equal(res.data.organization.id, 'test_KWqAGZ4mG')
    assert.equal(res.data.organization.role, 'admin')

    const cookies = res.headers['set-cookie'] as string[]
    assert.ok(cookies)
    const cookieJar = new CookieJar()
    for (const cookie of cookies) {
      cookieJar.setCookie(cookie, 'http://localhost')
    }
    const sessionCookie = await cookieJar.getCookieString('http://localhost')
    assert.ok(sessionCookie.includes('id_token='))
    assert.ok(sessionCookie.includes('id_token_sign='))
    assert.ok(!sessionCookie.includes('id_token_ex='))

    const cookieString = await cookieJar.getCookieString('http://localhost')
    const authenticatedAx = await axios()
    authenticatedAx.defaults.headers.Cookie = cookieString

    const membersRes = await authenticatedAx.get('/api/organizations/test_KWqAGZ4mG/members')
    assert.equal(membersRes.status, 200)
    assert.ok(membersRes.data.results.length > 0)
  })

  test('Fail without secret key', async () => {
    await assert.rejects(ax.post('/api/auth/pseudo', { type: 'user', id: 'test' }), { status: 401 })
  })

  test('Fail with wrong secret key', async () => {
    await assert.rejects(ax.post('/api/auth/pseudo?key=wrongkey', { type: 'user', id: 'test' }), { status: 401 })
  })

  test('Fail with non-existent user', async () => {
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'user', id: 'nonexistent' }), { status: 404 })
  })

  test('Fail with non-existent organization', async () => {
    await assert.rejects(ax.post('/api/auth/pseudo?key=testkey', { type: 'organization', id: 'nonexistent' }), { status: 404 })
  })

  test('Pseudo session cannot keepalive', async () => {
    const res = await ax.post('/api/auth/pseudo?key=testkey', {
      type: 'user',
      id: 'test_dmeadus0'
    })

    const cookies = res.headers['set-cookie'] as string[]
    const cookieJar = new CookieJar()
    for (const cookie of cookies) {
      cookieJar.setCookie(cookie, 'http://localhost')
    }

    const cookieString = await cookieJar.getCookieString('http://localhost')
    const authenticatedAx = await axios()
    authenticatedAx.defaults.headers.Cookie = cookieString

    let caughtError: any = null
    try {
      await authenticatedAx.post('/api/auth/keepalive')
    } catch (err: any) {
      caughtError = err
    }
    assert.equal(caughtError.status, 403)
  })
})
