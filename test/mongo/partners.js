const assert = require('assert').strict
const eventToPromise = require('event-to-promise')
const config = require('config')
const jwt = require('jsonwebtoken')
const testUtils = require('../utils')
const mails = require('../../server/mails')

describe('partners management api', () => {
  it('should invite a new partner in an organization', async () => {
    const { ax } = await testUtils.createUser('test-partners1@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Org 1' })).data
    const axOrg = await testUtils.axios('test-partners1@test.com', org.id)

    const mailPromise = eventToPromise(mails.events, 'send')
    await axOrg.post(`/api/organizations/${org.id}/partners`, { name: 'Org 2', contactEmail: 'test-partners2@test.com' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith(config.publicUrl + '/login?step=partnerInvitation&partner_invit_token='))
    const token = new URL(mail.link).searchParams.get('partner_invit_token')
    const tokenPayload = jwt.decode(token)
    assert.equal(tokenPayload.o, org.id)
    assert.equal(tokenPayload.n, 'Org 2')
    assert.equal(tokenPayload.e, 'test-partners2@test.com')

    let orgInfo = (await axOrg.get('/api/organizations/' + org.id)).data
    assert.equal(orgInfo.partners.length, 1)
    assert.ok(orgInfo.partners[0].partnerId)
    assert.ok(!orgInfo.partners[0].id)

    const { ax: ax2 } = await testUtils.createUser('test-partners2@test.com')
    const org2 = (await ax2.post('/api/organizations', { name: 'Org 2' })).data
    const axOrg2 = await testUtils.axios('test-partners2@test.com', org.id)

    await axOrg2.post(`/api/organizations/${org.id}/partners/_accept`, { id: org2.id, contactEmail: 'test-partners2@test.com', token })

    orgInfo = (await axOrg.get('/api/organizations/' + org.id)).data
    assert.equal(orgInfo.partners.length, 1)
    assert.equal(orgInfo.partners[0].id, org2.id)
    assert.ok(orgInfo.partners[0].partnerId)
  })
})
