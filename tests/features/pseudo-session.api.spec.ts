import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, devApiUrl } from '../support/axios.ts'
import { CookieJar } from 'tough-cookie'

const ax = await axios({ baseURL: devApiUrl })

test.describe('Pseudo session', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Create pseudo session for a user', async () => {
    const res = await ax.post('/api/auth/pseudo?key=testkey', {
      type: 'user',
      id: 'dmeadus0'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.pseudoSession, true)
    assert.equal(res.data.user.id, 'dmeadus0')

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
    assert.equal(meRes.data.id, 'dmeadus0')
    assert.equal(meRes.data.email, 'dmeadus0@answers.com')
  })

  test('Create pseudo session for an organization', async () => {
    const res = await ax.post('/api/auth/pseudo?key=testkey', {
      type: 'organization',
      id: 'KWqAGZ4mG',
      role: 'admin'
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.pseudoSession, true)
    assert.equal(res.data.organization.id, 'KWqAGZ4mG')
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

    const membersRes = await authenticatedAx.get('/api/organizations/KWqAGZ4mG/members')
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
      id: 'dmeadus0'
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
    assert.equal(caughtError.status, 401)
  })
})
