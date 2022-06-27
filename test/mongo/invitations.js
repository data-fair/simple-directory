const assert = require('assert').strict
const eventToPromise = require('event-to-promise')
const testUtils = require('../utils')
const mails = require('../../server/mails')

describe('organizations api', () => {
  it('should invite a new user in an organization', async () => {
    const { ax } = await testUtils.createUser('test-invit1@test.com')
    const anonymousAx = await testUtils.axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit2@test.com' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith('http://localhost:8080/api/invitations/_accept'))
    await assert.rejects(anonymousAx.get(mail.link), (res) => {
      assert.equal(res.status, 302)
      assert.ok(res.headers.location.startsWith('http://localhost:8080/login?step=createUser&invit_token='))
      return true
    })
  })
})
