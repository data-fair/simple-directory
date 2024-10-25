import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, createUser, waitForMail } from './utils/index.ts'

process.env.STORAGE_TYPE = 'mongo'

describe('users api', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should create a user', async () => {
    const config = (await import('../api/src/config.ts')).default
    const ax = await axios()
    const mailPromise = waitForMail()
    await ax.post('/api/users', { email: 'user@test.com', password: 'Test1234' })
    const mail = await mailPromise
    // sent a mail with a token_callback url to validate user creation
    assert.ok(mail.link.includes('token_callback'))
    await assert.rejects(ax(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      // redirect to login page on the createOrga step
      assert.ok(res.headers.location.startsWith(config.publicUrl + '/login?step=createOrga'))

      // auto login of the created user
      assert.ok(res.headers.location)
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token=')))
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token_sign=')))
      return true
    })

    const { ax: adminAx } = await createUser('admin@test.com', true)
    let users = (await adminAx.get('/api/users')).data
    assert.equal(users.results.length, 2)
    users = (await adminAx.get('/api/users?q=use')).data
    assert.equal(users.results.length, 1)
  })

  it('should send an email to confirm new password', async () => {
    const ax = await axios()
    const { user } = await createUser('user2@test.com')

    const mailPromise = waitForMail()
    await ax.post('/api/auth/action', { email: 'user2@test.com', action: 'changePassword' })
    const mail = await mailPromise
    assert.ok(mail.link.includes('action_token'))
    const actionToken = (new URL(mail.link)).searchParams.get('action_token')
    await ax.post(
      `/api/users/${user.id}/password`,
      { password: 'TestPassword01' },
      { params: { action_token: actionToken } }
    )
    const loginRes = (await ax.post('/api/auth/password', { email: 'user2@test.com', password: 'TestPassword01' })).data
    assert.ok(loginRes.includes('token_callback'))
  })

  it('should send an email to confirm new host if user exists on main host', async () => {
    const config = (await import('../api/src/config.ts')).default
    const anonymousAx = await axios()
    const { user, ax } = await createUser('user3@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: '127.0.0.1:5989', theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    const mailPromise = waitForMail()

    await anonymousAx.post('http://127.0.0.1:5989/simple-directory/api/auth/action', { email: 'user3@test.com', action: 'changePassword' })
    const mail = await mailPromise
    assert.ok(mail.link.includes('action_token'))
    const actionToken = (new URL(mail.link)).searchParams.get('action_token')
    await assert.rejects(ax.post(
      `/api/users/${user.id}/password`,
      { password: 'test.com' },
      { params: { action_token: actionToken } }
    ), { status: 401 })

    await ax.post(
      `/api/users/${user.id}/host`,
      { host: '127.0.0.1:5989' },
      { params: { action_token: actionToken } }
    )
  })
})
