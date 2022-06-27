const assert = require('assert').strict
const eventToPromise = require('event-to-promise')

const testUtils = require('../utils')

const mails = require('../../server/mails')

/* describe('users api', () => {
  it('Create a user', async () => {
    console.log(0)
    const adminAx = await testUtils.axios('alban.mouton@koumoul.com:testpasswd:adminMode')
    console.log(1)
    let res = await adminAx.get('/api/users')
    assert.equal(res.data.count, 1) // only the super admin at first

    const ax = await testUtils.axios()
    console.log(2)
    res = await ax.post('/api/users', {})
    console.log(3)
    assert.equal(res.status, 400)
    const mailPromise = eventToPromise(mails.events, 'send')
    res = await ax.post('/api/users', { email: 'user1@test.com' })
    assert.equal(res.status, 204)
    res = await adminAx.get('/api/users')
    assert.equal(res.data.count, 2)

    // received a mail with a link to validate email address
    const mail = await mailPromise
    const idToken = new URL(mail.link).searchParams.get('id_token')
    assert.ok(idToken)
    res = await ax.post('/api/auth/exchange', null, { params: { id_token: idToken } })
    const sessionToken = res.data
    assert.ok(sessionToken)
    res = await ax.post('/api/auth/exchange', null, { params: { id_token: sessionToken } })
    const sessionToken2 = res.data
    assert.ok(sessionToken2)
  })
}) */

describe('users api', () => {
  it('Create a user', async () => {
    const ax = await testUtils.axios()
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/users', { email: 'alban.mouton@koumoul.com' })
    const mail = await mailPromise
    console.log(mail)
  })
})
