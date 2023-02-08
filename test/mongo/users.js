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
      assert.ok(res.headers.location.startsWith('http://localhost:8080/login?step=createOrga'))
      assert.ok(res.status, 302)

      // auto login of the created user
      assert.ok(res.headers.location)
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token=')))
      assert.ok(res.headers['set-cookie'].find(c => c.startsWith('id_token_sign=')))
      return true
    })

    const { ax: adminAx } = await testUtils.createUser('alban.mouton@koumoul.com', true)
    let users = (await adminAx.get('/api/users')).data
    assert.equal(users.results.length, 2)
    users = (await adminAx.get('/api/users?q=use')).data
    assert.equal(users.results.length, 1)
  })
})
