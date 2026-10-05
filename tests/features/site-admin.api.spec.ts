import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, testEnvAx, createUser, deleteAllEmails, getServerConfig } from '../support/axios.ts'

// Site admins are the root admins of the organization owning a site, logged in on that site.
// They can list the accounts of their site and act on them (delete, cancel planned deletion,
// reset 2FA, revoke sessions), never on accounts of the main back-office or of other sites,
// and they cannot impersonate them (asAdmin is for superadmins only).
test.describe('site admin api', () => {
  const host2 = '127.0.0.1:' + process.env.NGINX_PORT2
  const siteDirectoryUrl = `http://${host2}/simple-directory`

  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
  })

  // main site of an organization at host2, a root admin and a plain member living on it
  const setup = async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { ax: ownerAx } = await createUser('site-admin-owner@test.com')
    const org = (await ownerAx.post('/api/organizations', { name: 'site-admin-org' })).data
    await adminAx.patch(`/api/organizations/${org.id}`, { departments: [{ id: 'dep1', name: 'Dep 1' }] })
    const owner = { type: 'organization', id: org.id, name: org.name }
    await (await axios()).post('/api/sites',
      { _id: 'test_site_admin', owner, host: host2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_site_admin', { isAccountMain: true })
    await testEnvAx.post('/clear-site-cache')

    const { user: siteAdminUser } = await createUser('site-admin@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-admin@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }] })
    const siteAdminAx = await axiosAuth({ email: 'site-admin@test.com', org: org.id, directoryUrl: siteDirectoryUrl, axiosOpts: { baseURL: siteDirectoryUrl } })

    const { ax: memberAx, user: member } = await createUser('site-member@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-member@test.com', { organizations: [{ id: org.id, name: org.name, role: 'user' }] })

    return { adminAx, ownerAx, org, siteAdminAx, siteAdminUser, memberAx, member }
  }

  test('should list the accounts of the site without their sessions', async () => {
    const { siteAdminAx, member } = await setup()

    const users = (await siteAdminAx.get('/api/users', { params: { allFields: true, host: host2 } })).data
    const listedMember = users.results.find((u: any) => u.id === member.id)
    assert.ok(listedMember)
    assert.equal(listedMember.email, 'site-member@test.com')
    assert.equal(listedMember.sessions, undefined)
    assert.ok(users.results.every((u: any) => u.host === host2))

    // the accounts of the main back-office are out of reach
    await assert.rejects(siteAdminAx.get('/api/users', { params: { allFields: true } }), { status: 403 })
    await assert.rejects(siteAdminAx.get('/api/users', { params: { allFields: true, host: 'other.example.com' } }), { status: 403 })
  })

  test('should list the accounts of the site even when listing users is reserved to superadmins', async () => {
    const { siteAdminAx, memberAx, member } = await setup()
    await testEnvAx.patch('/config', { listUsersMode: 'admin' })
    try {
      const users = (await siteAdminAx.get('/api/users', { params: { allFields: true, host: host2 } })).data
      assert.ok(users.results.find((u: any) => u.id === member.id))

      // outside of the administration of the site, the list mode still applies
      assert.equal((await siteAdminAx.get('/api/users')).data.count, 0)
      assert.equal((await memberAx.get('/api/users')).data.count, 0)
      await assert.rejects(memberAx.get('/api/users', { params: { allFields: true, host: host2 } }), { status: 403 })
      await assert.rejects(siteAdminAx.get('/api/users', { params: { allFields: true } }), { status: 403 })
    } finally {
      // null and not undefined, that would be dropped from the json body
      await testEnvAx.patch('/config', { listUsersMode: null })
    }
  })

  test('should reset the 2FA of an account of the site, and nothing else', async () => {
    const { adminAx, siteAdminAx, member } = await setup()
    await testEnvAx.patch('/user/site-member@test.com', { '2FA': { active: true, secret: 'secret' } })

    await assert.rejects(siteAdminAx.patch(`/api/users/${member.id}`, { email: 'hijack@test.com' }), { status: 403 })
    await assert.rejects(siteAdminAx.patch(`/api/users/${member.id}`, { '2FA': null, name: 'renamed' }), { status: 403 })
    await assert.rejects(siteAdminAx.patch(`/api/users/${member.id}`, { '2FA': { active: false } }), { status: 403 })

    await siteAdminAx.patch(`/api/users/${member.id}`, { '2FA': null })
    const user = (await adminAx.get(`/api/users/${member.id}`)).data
    assert.equal(user['2FA'], undefined)
    assert.equal(user.email, 'site-member@test.com')
  })

  test('should cancel the planned deletion of an account of the site', async () => {
    const { adminAx, siteAdminAx, member } = await setup()
    await testEnvAx.patch('/user/site-member@test.com', { plannedDeletion: '2099-01-01' })

    await siteAdminAx.delete(`/api/users/${member.id}/plannedDeletion`)
    const user = (await adminAx.get(`/api/users/${member.id}`)).data
    assert.equal(user.plannedDeletion, undefined)
  })

  test('should revoke all the sessions of an account of the site', async () => {
    const { adminAx, siteAdminAx, memberAx, member } = await setup()
    assert.ok((await adminAx.get(`/api/users/${member.id}`)).data.sessions.length > 0)

    await siteAdminAx.delete(`/api/users/${member.id}/sessions`)
    assert.equal((await adminAx.get(`/api/users/${member.id}`)).data.sessions.length, 0)
    await assert.rejects(memberAx.post('/api/auth/keepalive'), { status: 401 })
  })

  test('should delete an account of the site', async () => {
    const { adminAx, siteAdminAx, member } = await setup()
    await siteAdminAx.delete(`/api/users/${member.id}`)
    await assert.rejects(adminAx.get(`/api/users/${member.id}`), { status: 404 })
  })

  test('should not impersonate an account of the site', async () => {
    const { siteAdminAx, member } = await setup()
    await assert.rejects(siteAdminAx.post('/api/auth/asadmin', { id: member.id }), { status: 403 })
  })

  test('should not act on accounts outside of the site', async () => {
    const { siteAdminAx, siteAdminUser } = await setup()
    const { user: mainUser } = await createUser('site-admin-main-user@test.com')
    const { user: otherSiteUser } = await createUser('site-admin-other-site@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-admin-other-site@test.com', { host: 'other.example.com' })

    for (const target of [mainUser, otherSiteUser]) {
      await assert.rejects(siteAdminAx.delete(`/api/users/${target.id}/sessions`), { status: 403 })
      await assert.rejects(siteAdminAx.delete(`/api/users/${target.id}/plannedDeletion`), { status: 403 })
      await assert.rejects(siteAdminAx.patch(`/api/users/${target.id}`, { '2FA': null }), { status: 403 })
      await assert.rejects(siteAdminAx.delete(`/api/users/${target.id}`), { status: 403 })
    }

    // their own account only goes through the self-service routes
    await assert.rejects(siteAdminAx.delete(`/api/users/${siteAdminUser.id}/sessions`), { status: 403 })
    await assert.rejects(siteAdminAx.patch(`/api/users/${siteAdminUser.id}`, { '2FA': null }), { status: 403 })
  })

  test('should refuse department admins and plain members of the owner organization', async () => {
    const { org, memberAx } = await setup()
    await createUser('site-dep-admin@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-dep-admin@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin', department: 'dep1', departmentName: 'Dep 1' }] })
    const depAdminAx = await axiosAuth({ email: 'site-dep-admin@test.com', org: org.id, dep: 'dep1', directoryUrl: siteDirectoryUrl, axiosOpts: { baseURL: siteDirectoryUrl } })
    const { user: target } = await createUser('site-target@test.com', false, 'TestPasswd01', siteDirectoryUrl)

    for (const ax of [depAdminAx, memberAx]) {
      await assert.rejects(ax.get('/api/users', { params: { allFields: true, host: host2 } }), { status: 403 })
      await assert.rejects(ax.delete(`/api/users/${target.id}/sessions`), { status: 403 })
      await assert.rejects(ax.patch(`/api/users/${target.id}`, { '2FA': null }), { status: 403 })
    }
  })
})
