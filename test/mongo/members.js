const assert = require('assert').strict
const config = require('config')
const testUtils = require('../utils')

describe('organizations api', () => {
  it('should invite a user in orga and change his role', async () => {
    config.alwaysAcceptInvitation = true

    const { ax } = await testUtils.createUser('test-owner1@test.com')
    const { ax: axMember, user: memberUser } = await testUtils.createUser('test-member1@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-member1@test.com', role: 'user' })

    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    const newMember = members.find(m => m.email === 'test-member1@test.com')
    assert.equal(newMember.role, 'user')

    // the member cannot change his own role as a simple user
    await assert.rejects(
      axMember.patch(`/api/organizations/${org.id}/members/${memberUser.id}`, { role: 'admin' }),
      (err) => err.status === 403)
    // the admin can
    await ax.patch(`/api/organizations/${org.id}/members/${memberUser.id}`, { role: 'admin' })
    const patchedMembers = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    const patchedMember = patchedMembers.find(m => m.email === 'test-member1@test.com')
    assert.equal(patchedMember.role, 'admin')

    config.alwaysAcceptInvitation = false
  })
})
