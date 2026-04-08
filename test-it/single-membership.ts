import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'

process.env.STORAGE_TYPE = 'mongo'

describe('singleMembership addMember', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should update department when user already belongs to org', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.singleMembership = true
    config.alwaysAcceptInvitation = true

    try {
      const { ax } = await createUser('owner-sm@test.com')
      const org = (await ax.post('/api/organizations', {
        name: 'test-sm',
        departments: [
          { id: 'dep1', name: 'Department 1' },
          { id: 'dep2', name: 'Department 2' }
        ]
      })).data
      ax.setOrg(org.id)

      // invite a user into dep1
      await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'member-sm@test.com', role: 'user' })

      let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const member = members.find(m => m.email === 'member-sm@test.com')
      assert.equal(member.department, 'dep1')
      assert.equal(member.departmentName, 'Department 1')

      // now re-invite the same user into dep2 — with singleMembership this should update, not reject
      await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep2', email: 'member-sm@test.com', role: 'user' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter(m => m.email === 'member-sm@test.com')
      // singleMembership: only one entry, department updated
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].department, 'dep2')
      assert.equal(memberEntries[0].departmentName, 'Department 2')
    } finally {
      config.singleMembership = false
      config.alwaysAcceptInvitation = false
    }
  })

  it('should update role when user already belongs to org', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.singleMembership = true
    config.alwaysAcceptInvitation = true

    try {
      const { ax } = await createUser('owner-sm2@test.com')
      const org = (await ax.post('/api/organizations', { name: 'test-sm2' })).data
      ax.setOrg(org.id)

      // invite a user as 'user'
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm2@test.com', role: 'user' })

      let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const member = members.find(m => m.email === 'member-sm2@test.com')
      assert.equal(member.role, 'user')

      // re-invite as 'admin' — should update existing membership
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm2@test.com', role: 'admin' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter(m => m.email === 'member-sm2@test.com')
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].role, 'admin')
    } finally {
      config.singleMembership = false
      config.alwaysAcceptInvitation = false
    }
  })

  it('should remove department when re-added without one', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.singleMembership = true
    config.alwaysAcceptInvitation = true

    try {
      const { ax } = await createUser('owner-sm3@test.com')
      const org = (await ax.post('/api/organizations', {
        name: 'test-sm3',
        departments: [{ id: 'dep1', name: 'Department 1' }]
      })).data
      ax.setOrg(org.id)

      // invite a user into dep1
      await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'member-sm3@test.com', role: 'user' })

      let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const member = members.find(m => m.email === 'member-sm3@test.com')
      assert.equal(member.department, 'dep1')

      // re-invite without department — should move to org root
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm3@test.com', role: 'user' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter(m => m.email === 'member-sm3@test.com')
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].department, undefined)
      assert.equal(memberEntries[0].departmentName, undefined)
    } finally {
      config.singleMembership = false
      config.alwaysAcceptInvitation = false
    }
  })
})
