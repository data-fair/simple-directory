import { test } from '@playwright/test'
import assert from 'node:assert/strict'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axios, createUser, deleteAllEmails, loginBindingCookie, mockOidcControlUrl1, testEnvAx, waitForMail } from '../support/axios.ts'

// a token_callback url turns into a session for whoever opens it: redirect flows make it single use,
// links sent by email stay reusable (mail scanners prefetch them)
const open = (url: string) => axios()(url, { validateStatus: (s: number) => s === 302 })

test.describe('token_callback single use', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
  })

  test('a password login callback url works once', async () => {
    await createUser('single@test.com')
    const callbackUrl = (await axios().post('/api/auth/password', { email: 'single@test.com', password: 'TestPasswd01' })).data
    const first = await open(callbackUrl)
    assert.ok((first.headers['set-cookie']?.length ?? 0) >= 3)
    assert.ok(!first.headers.location.includes('error='))
    const second = await open(callbackUrl)
    assert.ok(!second.headers['set-cookie']?.length)
    assert.equal(new URL(second.headers.location).searchParams.get('error'), 'invalidToken')
  })

  test('a passwordless email link stays reusable', async () => {
    await createUser('mailed@test.com')
    const mail = await waitForMail(
      () => axios().post('/api/auth/passwordless', { email: 'mailed@test.com' }),
      (m) => m.to === 'mailed@test.com' && m.link?.includes('token_callback')
    )
    for (let i = 0; i < 2; i++) {
      const res = await open(mail.link)
      assert.ok((res.headers['set-cookie']?.length ?? 0) >= 3)
      assert.ok(!res.headers.location.includes('error='))
    }
  })

  test('an sso login callback url works once', async () => {
    const port = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', { sub: 'testcbsso', email: 'cbsso@test.com', email_verified: true, given_name: 'Cb', family_name: 'Sso' })
    const ax = axios()
    const loginInitial = await ax.get(`/api/auth/oauth/localhost${port}/login`, { validateStatus: (s: number) => s === 302 })
    const providerRes = await ax(loginInitial.headers.location, { validateStatus: (s: number) => s === 302 })
    const cb = await ax(providerRes.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (s: number) => s === 302 })
    const callbackUrl = cb.headers.location
    const first = await open(callbackUrl)
    assert.ok((first.headers['set-cookie']?.length ?? 0) >= 3)
    const second = await open(callbackUrl)
    assert.ok(!second.headers['set-cookie']?.length)
    assert.equal(new URL(second.headers.location).searchParams.get('error'), 'invalidToken')
  })
})
