import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { testEnvAx, createUser } from '../support/axios.ts'

test.describe('singleMembership addMember', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('should update department when user already belongs to org', async () => {
    await testEnvAx.patch('/config', { singleMembership: true, alwaysAcceptInvitation: true })

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
      const member = members.find((m: any) => m.email === 'member-sm@test.com')
      assert.equal(member.department, 'dep1')
      assert.equal(member.departmentName, 'Department 1')

      // now re-invite the same user into dep2 — with singleMembership this should update, not reject
      await ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep2', email: 'member-sm@test.com', role: 'user' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter((m: any) => m.email === 'member-sm@test.com')
      // singleMembership: only one entry, department updated
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].department, 'dep2')
      assert.equal(memberEntries[0].departmentName, 'Department 2')
    } finally {
      await testEnvAx.patch('/config', { singleMembership: false, alwaysAcceptInvitation: false })
    }
  })

  test('should update role when user already belongs to org', async () => {
    await testEnvAx.patch('/config', { singleMembership: true, alwaysAcceptInvitation: true })

    try {
      const { ax } = await createUser('owner-sm2@test.com')
      const org = (await ax.post('/api/organizations', { name: 'test-sm2' })).data
      ax.setOrg(org.id)

      // invite a user as 'user'
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm2@test.com', role: 'user' })

      let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const member = members.find((m: any) => m.email === 'member-sm2@test.com')
      assert.equal(member.role, 'user')

      // re-invite as 'admin' — should update existing membership
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm2@test.com', role: 'admin' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter((m: any) => m.email === 'member-sm2@test.com')
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].role, 'admin')
    } finally {
      await testEnvAx.patch('/config', { singleMembership: false, alwaysAcceptInvitation: false })
    }
  })

  test('should remove department when re-added without one', async () => {
    await testEnvAx.patch('/config', { singleMembership: true, alwaysAcceptInvitation: true })

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
      const member = members.find((m: any) => m.email === 'member-sm3@test.com')
      assert.equal(member.department, 'dep1')

      // re-invite without department — should move to org root
      await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'member-sm3@test.com', role: 'user' })

      members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
      const memberEntries = members.filter((m: any) => m.email === 'member-sm3@test.com')
      assert.equal(memberEntries.length, 1)
      assert.equal(memberEntries[0].department, undefined)
      assert.equal(memberEntries[0].departmentName, undefined)
    } finally {
      await testEnvAx.patch('/config', { singleMembership: false, alwaysAcceptInvitation: false })
    }
  })
})
