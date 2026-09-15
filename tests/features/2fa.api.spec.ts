import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { authenticator } from 'otplib'
import { axios, createUser, testEnvAx, waitForMail, deleteAllEmails } from '../support/axios.ts'

// avoid TOTP step-boundary flakiness: a code generated right before a 30s boundary
// can be expired by the time the server checks it
const freshTotp = async (secret: string) => {
  if (authenticator.timeRemaining() < 3) await new Promise(resolve => setTimeout(resolve, 3000))
  return authenticator.generate(secret)
}

// start a TOTP enrolment (secret generated, not yet confirmed), returns the secret
const init2FA = async (email: string, password = 'TestPasswd01') => {
  const initRes = await axios().post('/api/2fa', { email, password })
  const secret = new URL(initRes.data.otpauth).searchParams.get('secret')
  assert.ok(secret)
  return secret
}

// full TOTP enrolment, returns the secret and the recovery token
const setup2FA = async (email: string, password = 'TestPasswd01') => {
  const secret = await init2FA(email, password)
  const res = await axios().post('/api/2fa', { email, password, token: await freshTotp(secret) })
  return { secret, recovery: res.data.recovery as string }
}

// request a magic link, resolves with the mail or rejects with the API error
const passwordless = (email: string) => waitForMail(
  () => axios().post('/api/auth/passwordless', { email }),
  (m) => m.to === email && m.link?.includes('token_callback')
)

test.describe('2FA lifecycle', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
  })

  test('passwordless login is refused while 2FA is active', async () => {
    await createUser('user@test.com')
    await setup2FA('user@test.com')
    await assert.rejects(axios().post('/api/auth/passwordless', { email: 'user@test.com' }), (err: any) => err.status === 400)
  })

  test('passwordless login works while a 2FA enrolment is pending', async () => {
    await createUser('user@test.com')
    await init2FA('user@test.com')
    const mail = await passwordless('user@test.com')
    assert.ok(mail.link)
  })

  test('passwordless login works again after a superadmin dropped the 2FA', async () => {
    const { user } = await createUser('user@test.com')
    await setup2FA('user@test.com')
    const { ax: adminAx } = await createUser('admin@test.com', true)
    await adminAx.patch(`/api/users/${user.id}`, { '2FA': null })
    const mail = await passwordless('user@test.com')
    assert.ok(mail.link)
  })

  test('logging in with the recovery token removes the 2FA configuration', async () => {
    const { user } = await createUser('user@test.com')
    const { recovery } = await setup2FA('user@test.com')
    await assert.rejects(
      axios().post('/api/auth/password', { email: 'user@test.com', password: 'TestPasswd01', '2fa': recovery }),
      (err: any) => err.status === 403 && err.data === '2fa-missing'
    )
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const patched = (await adminAx.get(`/api/users/${user.id}`)).data
    assert.equal(patched['2FA'], undefined)
  })
})
