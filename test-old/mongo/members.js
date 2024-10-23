const assert = require('assert').strict
const config = require('config')
const util = require('util')
const testUtils = require('../utils')

describe('organizations members api', () => {
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

  it('should invite a user in orga in multiple departments', async () => {
    config.alwaysAcceptInvitation = true

    const { ax } = await testUtils.createUser('test-owner2@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'test-member2@test.com', role: 'user' })

    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    const newMember = members.find(m => m.email === 'test-member2@test.com')
    assert.equal(newMember.department, 'dep1')
    assert.equal(newMember.departmentName, 'Department 1')
    assert.equal(newMember.role, 'user')

    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep2', email: 'test-member2@test.com', role: 'admin' })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    let newMembers = members.filter(m => m.email === 'test-member2@test.com')
    assert.equal(newMembers.length, 2)
    assert.equal(newMembers[0].department, 'dep1')
    assert.equal(newMembers[0].departmentName, 'Department 1')
    assert.equal(newMembers[0].role, 'user')
    assert.equal(newMembers[1].department, 'dep2')
    assert.equal(newMembers[1].departmentName, 'Department 2')
    assert.equal(newMembers[1].role, 'admin')

    await ax.delete(`/api/organizations/${org.id}/members/${newMembers[0].id}?department=dep2`)
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    newMembers = members.filter(m => m.email === 'test-member2@test.com')
    assert.equal(newMembers.length, 1)
    assert.equal(newMembers[0].department, 'dep1')
    assert.equal(newMembers[0].role, 'user')

    await assert.rejects(ax.patch(`/api/organizations/${org.id}/members/${newMembers[0].id}?dep=dep2`, { role: 'config', department: 'dep2' }), (err) => err.status === 400)
    await ax.patch(`/api/organizations/${org.id}/members/${newMembers[0].id}?department=dep1`, { role: 'admin', department: 'dep1' })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    newMembers = members.filter(m => m.email === 'test-member2@test.com')
    assert.equal(newMembers.length, 1)
    assert.equal(newMembers[0].department, 'dep1')
    assert.equal(newMembers[0].role, 'admin')

    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-member2@test.com', role: 'user' }), err => err.status === 400)
    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'test-owner2@test.com', role: 'user' }), err => err.status === 400)
    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, department: 'baddep', email: 'test-member2@test.com', role: 'user' }), err => err.status === 404)

    config.alwaysAcceptInvitation = false
  })

  it('should send emails based on roles and departments', async () => {
    config.alwaysAcceptInvitation = true

    const { ax } = await testUtils.createUser('owner@test3.com')

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'user1dep1@test3.com', role: 'user' })
    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'admin1dep1@test3.com', role: 'admin' })
    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep2', email: 'user1dep2@test3.com', role: 'user' })
    await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep2', email: 'admin1dep2@test3.com', role: 'admin' })
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'user1@test3.com', role: 'user' })
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'admin1@test3.com', role: 'admin' })

    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results

    const sendEmails = async (to, subject) => {
      const res = await ax.post('/api/mails',
        { to, subject, text: '' },
        { params: { key: 'testkey' } }
      )
      assert.equal(res.status, 200)
      await new Promise(resolve => setTimeout(resolve, 50))
      return (await util.promisify(global.app.get('maildev').getAllEmail)())
        .filter(m => m.subject === subject)
    }

    let emails = await sendEmails(
      [{ type: 'user', id: members.find(m => m.email === 'admin1@test3.com').id }],
      'test-email-user'
    )
    assert.equal(emails.length, 1)
    assert.equal(emails[0].envelope.to[0].address, 'admin1@test3.com')

    emails = await sendEmails(
      [{ type: 'organization', id: org.id }],
      'test-email-root-users'
    )
    assert.equal(emails.length, 1)
    assert.equal(emails[0].to.length, 3)
    assert.ok(emails[0].to.find(t => t.address === 'owner@test3.com'))
    assert.ok(emails[0].to.find(t => t.address === 'user1@test3.com'))
    assert.ok(emails[0].to.find(t => t.address === 'admin1@test3.com'))

    emails = await sendEmails(
      [{ type: 'organization', id: org.id, role: 'admin' }],
      'test-email-root-admin'
    )
    assert.equal(emails.length, 1)
    assert.equal(emails[0].to.length, 2)
    assert.ok(emails[0].to.find(t => t.address === 'owner@test3.com'))
    assert.ok(emails[0].to.find(t => t.address === 'admin1@test3.com'))

    emails = await sendEmails(
      [{ type: 'organization', id: org.id, department: '*' }],
      'test-email-all-deps'
    )
    assert.equal(emails.length, 1)
    assert.equal(emails[0].to.length, 7)

    emails = await sendEmails(
      [{ type: 'organization', id: org.id, department: 'dep1', role: 'admin' }],
      'test-email-admin-dep1'
    )
    assert.equal(emails.length, 1)
    assert.equal(emails[0].to.length, 1)
    assert.ok(emails[0].to.find(t => t.address === 'admin1dep1@test3.com'))
  })
})
