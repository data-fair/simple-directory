const assert = require('assert').strict
const eventToPromise = require('event-to-promise')
const config = require('config')
const testUtils = require('../utils')
const mails = require('../../server/mails')

describe('organizations api', () => {
  it('should invite a new user in an organization', async () => {
    const { ax } = await testUtils.createUser('test-invit1@test.com')
    const anonymousAx = await testUtils.axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit2@test.com', role: 'user' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith('http://localhost:8080/api/invitations/_accept'))

    // before accepting the user is not yet member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)
    assert.equal(members[0].email, 'test-invit1@test.com')

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith('http://localhost:8080/login?step=createUser&invit_token='))
      return true
    })
    const invitToken = new URL(redirect).searchParams.get('invit_token')
    assert.ok(invitToken)

    // user was not yet created and accepted as member
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)

    // create user and accept invitation
    await anonymousAx.post('/api/users', { email: 'test-invit2@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find(m => m.email === 'test-invit2@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')

    members = (await ax.get(`/api/organizations/${org.id}/members?q=test`)).data.results
    assert.equal(members.length, 2)
    members = (await ax.get(`/api/organizations/${org.id}/members?q=test-invit2@test.com`)).data.results
    assert.equal(members.length, 1)
  })

  it('should invite an existing user in an organization', async () => {
    const { ax } = await testUtils.createUser('test-invit3@test.com')
    await testUtils.createUser('test-invit4@test.com')
    const anonymousAx = await testUtils.axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit4@test.com', role: 'user' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith('http://localhost:8080/api/invitations/_accept'))

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith('http://localhost:8080/invitation'))
      return true
    })

    // after accepting the user is a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find(m => m.email === 'test-invit4@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
  })

  it('should invite a new user in an organization in alwaysAcceptInvitation mode', async () => {
    config.alwaysAcceptInvitation = true

    const { ax } = await testUtils.createUser('test-invit5@test.com')
    const anonymousAx = await testUtils.axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit6@test.com', role: 'user' })
    const mail = await mailPromise
    // the person is redirected by mail to a page to create their user
    assert.ok(mail.link.startsWith('http://localhost:8080/login?step=createUser&invit_token='))
    const invitToken = new URL(mail.link).searchParams.get('invit_token')

    // the user is already added as a member but flagged as not finalized (emailConfirmed=false)
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    let newMember = members.find(m => m.email === 'test-invit6@test.com')
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, false)

    // invite in a second organization
    const org2 = (await ax.post('/api/organizations', { name: 'test2' })).data
    await ax.post('/api/invitations', { id: org2.id, name: org2.name, email: 'test-invit6@test.com', role: 'user' })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find(m => m.email === 'test-invit6@test.com')
    assert.equal(newMember.emailConfirmed, false)
    members = (await ax.get(`/api/organizations/${org2.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find(m => m.email === 'test-invit6@test.com')
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, false)

    // finalize user creation and invitation
    await anonymousAx.post('/api/users', { email: 'test-invit6@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find(m => m.email === 'test-invit6@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, true)

    config.alwaysAcceptInvitation = false
  })

  it('should invite an existing user in an organization in alwaysAcceptInvitation mode', async () => {
    config.alwaysAcceptInvitation = true

    const { ax } = await testUtils.createUser('test-invit7@test.com')
    await testUtils.createUser('test-invit8@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit8@test.com', role: 'user' })

    // the user is already added as a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find(m => m.email === 'test-invit8@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, true)

    config.alwaysAcceptInvitation = false
  })

  it('should invite a new user in multiple organization departments', async () => {
    const { ax } = await testUtils.createUser('test-invit9@test.com')
    const anonymousAx = await testUtils.axios()

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    const mailPromise = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit10@test.com', department: 'dep1', role: 'user' })
    const mail = await mailPromise
    assert.ok(mail.link.startsWith('http://localhost:8080/api/invitations/_accept'))

    // before accepting the user is not yet member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)
    assert.equal(members[0].email, 'test-invit9@test.com')

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      return true
    })
    const invitToken = new URL(redirect).searchParams.get('invit_token')

    // create user and accept invitation
    await anonymousAx.post('/api/users', { email: 'test-invit10@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find(m => m.email === 'test-invit10@test.com')
    assert.ok(newMember)
    assert.ok(newMember.emailConfirmed)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.department, 'dep1')
    assert.equal(newMember.departmentName, 'Department 1')

    // log in a newly invited user
    const newAx = await testUtils.axios('test-invit10@test.com:Test1234')
    const newUser = (await newAx.get('/api/auth/me')).data
    assert.equal(newUser.organization.name, 'test')
    assert.equal(newUser.organization.department, 'dep1')
    assert.equal(newUser.organization.role, 'user')

    // send a second invitation
    const mailPromise2 = eventToPromise(mails.events, 'send')
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit10@test.com', department: 'dep2', role: 'admin' })
    const mail2 = await mailPromise2
    assert.ok(mail2.link.startsWith('http://localhost:8080/api/invitations/_accept'))

    // before accepting the user is not yet member of the second department
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    assert.equal(members.filter(m => m.email === 'test-invit10@test.com').length, 1)

    // when clicking on the link the person accepts the invitation and is redirected to to a page
    await assert.rejects(newAx.get(mail2.link), (res) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      return true
    })
    assert.ok(redirect.startsWith('http://localhost:8080/invitation'))

    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 3)
    assert.equal(members.filter(m => m.email === 'test-invit10@test.com').length, 2)
  })
})
