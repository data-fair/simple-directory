const config = require('config')
const assert = require('assert').strict
const eventToPromise = require('event-to-promise')
const testUtils = require('../utils')
const mails = require('../../server/mails')

describe('users api', () => {
  it('should create a user', async () => {
    const ax = await testUtils.axios()
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/users', { email: 'user@test.com', password: 'Test1234' })
    const mail = await mailPromise
    // sent a mail with a token_callback url to validate user creation
    assert.ok(mail.link.includes('token_callback'))
    await assert.rejects(ax(mail.link), (res) => {
      // redirect to login page on the createOrga step
      assert.ok(res.headers.location.startsWith(config.publicUrl + '/login?step=createOrga'))
      assert.ok(res.status, 302)

      // auto login of the created user
      assert.ok(res.headers.location)
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token=')))
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token_sign=')))
      return true
    })

    const { ax: adminAx } = await testUtils.createUser('admin@test.com', true)
    let users = (await adminAx.get('/api/users')).data
    assert.equal(users.results.length, 3)
    users = (await adminAx.get('/api/users?q=use')).data
    assert.equal(users.results.length, 1)
  })

  it('should send an email to confirm new password', async () => {
    const ax = await testUtils.axios()
    const { user } = await testUtils.createUser('user2@test.com')

    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/auth/action', { email: 'user2@test.com', action: 'changePassword' })
    const mail = await mailPromise
    assert.ok(mail.link.includes('action_token'))
    const actionToken = (new URL(mail.link)).searchParams.get('action_token')
    await ax.post(
      `/api/users/${user.id}/password`,
      { email: 'user2@test.com', password: 'TestPassword01' },
      { params: { action_token: actionToken } }
    )
    const loginRes = (await ax.post('/api/auth/password', { email: 'user2@test.com', password: 'TestPassword01' })).data
    assert.ok(loginRes.includes('token_callback'))
  })

  it('should send an email to confirm new host if user exists on main host', async () => {
    const anonymousAx = await testUtils.axios()
    const { user, ax } = await testUtils.createUser('user3@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: '127.0.0.1:5989', theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    const mailPromise = eventToPromise(mails.events, 'send')

    await anonymousAx.post('http://127.0.0.1:5989/simple-directory/api/auth/action', { email: 'user3@test.com', action: 'changePassword' })
    const mail = await mailPromise
    console.log(mail.link)
    assert.ok(mail.link.includes('action_token'))
    const actionToken = (new URL(mail.link)).searchParams.get('action_token')
    await assert.rejects(ax.post(
      `/api/users/${user.id}/password`,
      { email: 'user3@test.com', password: 'test.com' },
      { params: { action_token: actionToken } }
    ), (err) => {
      assert.equal(err.status, 401)
      return true
    })

    await ax.post(
      `/api/users/${user.id}/host`,
      { email: 'user3@test.com', host: '127.0.0.1:5989' },
      { params: { action_token: actionToken } }
    )
  })
})
