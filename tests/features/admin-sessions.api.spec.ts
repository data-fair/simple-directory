import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { authenticator } from 'otplib'
import { axiosAuth, axios, testEnvAx } from '../support/axios.ts'
import type { AxiosAuthInstance } from '@data-fair/lib-node/axios-auth.js'

// configure TOTP 2FA for a user through the /api/2fa endpoints, returns the TOTP secret
const setup2FA = async (email: string, password = 'TestPasswd01') => {
  const anonymAx = axios()
  const initRes = await anonymAx.post('/api/2fa', { email, password })
  const secret = new URL(initRes.data.otpauth).searchParams.get('secret')
  assert.ok(secret)
  await anonymAx.post('/api/2fa', { email, password, token: authenticator.generate(secret) })
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

test.describe('Superadmin session hardening', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('adminMode login ignores the 2FA session cookie', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com' }) as AxiosAuthInstance
    const secret = await setup2FA('admin@test.com')

    // a normal login with a TOTP code sets the 2FA session cookie
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', '2fa': authenticator.generate(secret) })
    // thanks to the cookie a normal login no longer needs the TOTP code
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01' })

    // an adminMode login refuses the cookie shortcut
    await assert.rejects(
      ax.post('/api/auth/password', { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true }),
      (err: any) => err.status === 403 && err.data === '2fa-required'
    )

    // an adminMode login with a fresh TOTP code succeeds
    await passwordLoginFull(ax, { email: 'admin@test.com', password: 'TestPasswd01', adminMode: true, '2fa': authenticator.generate(secret) })
    const me = (await ax.get('/api/auth/me')).data
    assert.ok(me.adminMode)
  })
})
