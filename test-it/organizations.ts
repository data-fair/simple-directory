import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer, createUser, axiosAuth, waitForMail, deleteAllEmails, getAllEmails } from './utils/index.ts'
import jwt, { type JwtPayload } from 'jsonwebtoken'

process.env.STORAGE_TYPE = 'mongo'

describe('organizations api', () => {
  before(deleteAllEmails)
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should create an organization', async () => {
    const { ax: adminAx } = await createUser('admin@test.com')
    const { ax, user } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test' })
    const orgs = (await adminAx.get('/api/organizations')).data.results
    assert.equal(orgs.length, 1)
    assert.equal(orgs[0].name, 'test')
    const freshUser = (await ax.get('/api/users/' + user.id)).data
    assert.equal(freshUser.organizations.length, 1)
    assert.equal(freshUser.organizations[0].id, orgs[0].id)
    assert.equal(freshUser.organizations[0].name, 'test')
    assert.equal(freshUser.organizations[0].role, 'admin')
  })

  it('should create an organization with departments', async () => {
    const { ax: adminAx } = await createUser('admin@test.com')
    const { ax } = await createUser('test-org2@test.com')
    await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }] })
    const orgs = (await adminAx.get('/api/organizations')).data.results
    assert.equal(orgs.length, 1)
    assert.equal(orgs[0].name, 'test')
    assert.ok(!orgs[0].departments)
    ax.setOrg(orgs[0].id)
    const detailedOrg = (await ax.get('/api/organizations/' + orgs[0].id)).data
    assert.equal(detailedOrg.departments.length, 1)
  })

  it('should invite a new partner in an organization', async () => {
    const config = (await import('../api/src/config.ts')).default

    const { ax } = await createUser('test-partners1@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Org 1' })).data
    ax.setOrg(org.id)

    const mailPromise = waitForMail()
    await ax.post(`/api/organizations/${org.id}/partners`, { name: 'Org 2', contactEmail: 'test-partners2@test.com' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith(config.publicUrl + '/login?step=partnerInvitation&partner_invit_token='))
    const token = new URL(mail.link).searchParams.get('partner_invit_token')
    assert.ok(token)
    const tokenPayload = jwt.decode(token) as JwtPayload
    assert.equal(tokenPayload.o, org.id)
    assert.equal(tokenPayload.n, 'Org 2')
    assert.equal(tokenPayload.e, 'test-partners2@test.com')

    let orgInfo = (await ax.get('/api/organizations/' + org.id)).data
    assert.equal(orgInfo.partners.length, 1)
    assert.ok(orgInfo.partners[0].partnerId)
    assert.ok(!orgInfo.partners[0].id)

    const { ax: ax2 } = await createUser('test-partners2@test.com')
    const org2 = (await ax2.post('/api/organizations', { name: 'Org 2' })).data
    const axOrg2 = await axiosAuth({ email: 'test-partners2@test.com', org: org2.id })

    await axOrg2.post(`/api/organizations/${org.id}/partners/_accept`, { id: org2.id, contactEmail: 'test-partners2@test.com', token })

    orgInfo = (await ax.get('/api/organizations/' + org.id)).data
    assert.equal(orgInfo.partners.length, 1)
    assert.equal(orgInfo.partners[0].id, org2.id)
    assert.ok(orgInfo.partners[0].partnerId)

    const userPartners = (await axOrg2.get(`/api/organizations/${org.id}/partners/_user-partners`)).data
    assert.equal(userPartners.length, 1)
    assert.equal(userPartners[0].id, org2.id)
    assert.equal(userPartners[0].name, org2.name)
  })

  it('should invite a user in orga and change his role', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.alwaysAcceptInvitation = true

    const { ax } = await createUser('test-owner1@test.com')
    const { ax: axMember, user: memberUser } = await createUser('test-member1@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-member1@test.com', role: 'user' })

    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    const newMember = members.find(m => m.email === 'test-member1@test.com')
    assert.equal(newMember.role, 'user')

    // the member cannot change his own role as a simple user
    await assert.rejects(
      axMember.patch(`/api/organizations/${org.id}/members/${memberUser.id}`, { role: 'admin' }),
      { status: 403 })
    // the admin can
    await ax.patch(`/api/organizations/${org.id}/members/${memberUser.id}`, { role: 'admin' })
    const patchedMembers = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    const patchedMember = patchedMembers.find(m => m.email === 'test-member1@test.com')
    assert.equal(patchedMember.role, 'admin')

    config.alwaysAcceptInvitation = false
  })

  it('should invite a user in orga in multiple departments', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.alwaysAcceptInvitation = true

    const { ax } = await createUser('test-owner2@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    ax.setOrg(org.id)
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

    await assert.rejects(ax.patch(`/api/organizations/${org.id}/members/${newMembers[0].id}?dep=dep2`, { role: 'config', department: 'dep2' }), { status: 400 })
    await ax.patch(`/api/organizations/${org.id}/members/${newMembers[0].id}?department=dep1`, { role: 'admin', department: 'dep1' })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    newMembers = members.filter(m => m.email === 'test-member2@test.com')
    assert.equal(newMembers.length, 1)
    assert.equal(newMembers[0].department, 'dep1')
    assert.equal(newMembers[0].role, 'admin')

    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-member2@test.com', role: 'user' }), { status: 400 })
    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, department: 'dep1', email: 'test-owner2@test.com', role: 'user' }), { status: 400 })
    await assert.rejects(ax.post('/api/invitations', { id: org.id, name: org.name, department: 'baddep', email: 'test-member2@test.com', role: 'user' }), { status: 404 })

    config.alwaysAcceptInvitation = false
  })

  it('should send emails based on roles and departments', async () => {
    const config = (await import('../api/src/config.ts')).default
    config.alwaysAcceptInvitation = true

    const { ax } = await createUser('owner@test3.com')

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    ax.setOrg(org.id)
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
      return (await getAllEmails()).filter(m => m.subject === subject)
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

    const membersEmail1 = (await ax.get(`/api/organizations/${org.id}/members`, {
      params: { email: 'owner@test3.com' }
    })).data.results
    assert.equal(membersEmail1.length, 1)

    const membersEmail2 = (await ax.get(`/api/organizations/${org.id}/members`, {
      params: { email: 'owner@test3.com,admin1@test3.com' }
    })).data.results
    assert.equal(membersEmail2.length, 2)
  })
})
