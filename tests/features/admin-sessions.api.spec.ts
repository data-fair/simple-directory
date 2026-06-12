import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { authenticator } from 'otplib'
import { axiosAuth, axios, testEnvAx } from '../support/axios.ts'
import type { AxiosAuthInstance } from '@data-fair/lib-node/axios-auth.js'

// avoid TOTP step-boundary flakiness: a code generated right before a 30s boundary
// can be expired by the time the server checks it
const freshTotp = async (secret: string) => {
  if (authenticator.timeRemaining() < 3) await new Promise(resolve => setTimeout(resolve, 3000))
  return authenticator.generate(secret)
}

// configure TOTP 2FA for a user through the /api/2fa endpoints, returns the TOTP secret
const setup2FA = async (email: string, password = 'TestPasswd01') => {
  const anonymAx = axios()
  const initRes = await anonymAx.post('/api/2fa', { email, password })
  const secret = new URL(initRes.data.otpauth).searchParams.get('secret')
  assert.ok(secret)
  await anonymAx.post('/api/2fa', { email, password, token: await freshTotp(secret) })
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

// extract and decode the id_token_ex JWT payload from a response's set-cookie headers
const readExchangeCookie = (res: any) => {
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  const exCookie = setCookies.find((c: string) => c.startsWith('id_token_ex='))
  assert.ok(exCookie, 'missing id_token_ex set-cookie header')
  const tokenValue = exCookie.match(/^id_token_ex=([^;]+)/)![1]
  return JSON.parse(Buffer.from(tokenValue.split('.')[1], 'base64url').toString())
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
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', '2fa': await freshTotp(secret) })
    // thanks to the cookie a normal login no longer needs the TOTP code
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01' })

    // an adminMode login refuses the cookie shortcut
    await assert.rejects(
      ax.post('/api/auth/password', { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true }),
      (err: any) => err.status === 403 && err.data === '2fa-required'
    )

    // an adminMode login with a fresh TOTP code succeeds
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true, '2fa': await freshTotp(secret) })
    const me = (await ax.get('/api/auth/me')).data
    assert.ok(me.adminMode)
  })

  test('offerAdminMode proposes adminMode to superadmins only', async () => {
    // superadmin: the flag yields a step response and creates no auth session
    const adminAx = await axiosAuth({ email: 'admin@test.com' }) as AxiosAuthInstance
    let res = await adminAx.post('/api/auth/password', { email: 'admin@test.com', password: 'TestPasswd01', offerAdminMode: true })
    assert.deepEqual(res.data, { step: 'adminMode' })
    // no auth-session cookie is issued on the offer response (the adminMode session is only
    // created after the accept resubmit below)
    const offerSetCookies: string[] = res.headers['set-cookie'] ?? []
    assert.ok(!offerSetCookies.some((c: string) => c.startsWith('id_token=') || c.startsWith('id_token_ex=')),
      `offer response must not set auth-session cookies, got: ${offerSetCookies.map(c => c.split('=')[0]).join(', ')}`)

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
})
