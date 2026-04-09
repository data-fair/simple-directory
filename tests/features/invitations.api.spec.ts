import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, testEnvAx, createUser, deleteAllEmails, waitForMail, directoryUrl, getServerConfig } from '../support/axios.ts'

test.describe('invitations', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
    // ensure invitations are not auto-accepted (dev config has alwaysAcceptInvitation: true)
    await testEnvAx.patch('/config', { alwaysAcceptInvitation: false, multiRoles: false })
  })

  test('should invite a new user in an organization', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('test-invit1@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)

    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit2@test.com', role: 'user' })
    )
    assert.ok(mail.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // before accepting the user is not yet member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)
    assert.equal(members[0].email, 'test-invit1@test.com')

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect: string | undefined
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location as string
      assert.ok(redirect.startsWith(config.publicUrl + '/login?step=createUser&invit_token='))
      return true
    })
    const invitToken = new URL(redirect ?? '').searchParams.get('invit_token')
    assert.ok(invitToken)

    // user was not yet created and accepted as member
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)

    // create user and accept invitation
    await anonymousAx.post('/api/users', { email: 'test-invit2@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit2@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')

    members = (await ax.get(`/api/organizations/${org.id}/members?q=test`)).data.results
    assert.equal(members.length, 2)
    members = (await ax.get(`/api/organizations/${org.id}/members?q=test-invit2@test.com`)).data.results
    assert.equal(members.length, 1)
  })

  test('should invite an existing user in an organization', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('test-invit3@test.com')
    await createUser('test-invit4@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)
    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit4@test.com', role: 'user' })
    )
    assert.ok(mail.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // when clicking on the link the person is redirected to a page to login
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith(config.publicUrl + '/login?email=test-invit4'))
      const redirectUrl = new URL(redirect)
      const reboundRedirect = redirectUrl.searchParams.get('redirect')
      assert.equal(reboundRedirect, config.publicUrl + '/invitation')
      return true
    })

    // after accepting the user is a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit4@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
  })

  test('should invite a logged in user in an organization', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('test-invit3@test.com')
    const { ax: axInvited } = await createUser('test-invit4@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)
    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit4@test.com', role: 'user' })
    )
    assert.ok(mail.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // when clicking on the link the person is redirected to a page to login
    let redirect
    await assert.rejects(axInvited.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith(config.publicUrl + '/invitation?email=test-invit4'))
      return true
    })

    const { data: mySession } = await axInvited.get('/api/auth/my-session')
    // session was updated
    assert.equal(mySession.user.organizations.length, 1)
    // org was switched to
    assert.equal(mySession.organization.id, org.id)
    // org was marked as default
    assert.equal(mySession.organization.dflt, 1)

    // after accepting the user is a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit4@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
  })

  test('should invite a new user in an organization in alwaysAcceptInvitation mode', async () => {
    const config = await getServerConfig()
    await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })

    const { ax } = await createUser('test-invit5@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)
    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit6@test.com', role: 'user' })
    )

    // the person is redirected by mail to a page to create their user
    assert.ok(mail.link.startsWith(config.publicUrl + '/login?step=createUser&invit_token='))
    const invitToken = new URL(mail.link).searchParams.get('invit_token')

    // the user is already added as a member but flagged as not finalized (emailConfirmed=false)
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    let newMember = members.find((m: any) => m.email === 'test-invit6@test.com')
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, false)

    // invite in a second organization
    ax.setOrg('')
    const org2 = (await ax.post('/api/organizations', { name: 'test2' })).data
    ax.setOrg(org2.id)
    await ax.post('/api/invitations', { id: org2.id, name: org2.name, email: 'test-invit6@test.com', role: 'user' })
    members = (await ax.get(`/api/organizations/${org2.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find((m: any) => m.email === 'test-invit6@test.com')
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, false)

    // didn't alter members of org1
    ax.setOrg(org.id)
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find((m: any) => m.email === 'test-invit6@test.com')
    assert.equal(newMember.emailConfirmed, false)

    // finalize user creation and invitation
    await anonymousAx.post('/api/users', { email: 'test-invit6@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find((m: any) => m.email === 'test-invit6@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, true)

    await testEnvAx.patch('/config', { alwaysAcceptInvitation: false })
  })

  test('should invite an existing user in an organization in alwaysAcceptInvitation mode', async () => {
    await getServerConfig()
    await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })

    const { ax } = await createUser('test-invit7@test.com')
    await createUser('test-invit8@test.com')

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)
    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit8@test.com', role: 'user' })

    // the user is already added as a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit8@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.emailConfirmed, true)

    await testEnvAx.patch('/config', { alwaysAcceptInvitation: false })
  })

  test('should invite a new user in multiple organization departments', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('test-invit9@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }] })).data
    ax.setOrg(org.id)
    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit10@test.com', department: 'dep1', role: 'user' })
    )
    assert.equal(mail.subject, `Rejoignez l'organisation test (Department 1) sur ${new URL(config.publicUrl).host}`)
    assert.ok(mail.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // before accepting the user is not yet member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)
    assert.equal(members[0].email, 'test-invit9@test.com')

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect: string | undefined
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      return true
    })
    const invitToken = new URL(redirect ?? '').searchParams.get('invit_token')

    // create user and accept invitation
    await anonymousAx.post('/api/users', { email: 'test-invit10@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit10@test.com')
    assert.ok(newMember)
    assert.ok(newMember.emailConfirmed)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.department, 'dep1')
    assert.equal(newMember.departmentName, 'Department 1')

    // log in a newly invited user
    const newAx = await axiosAuth({ email: 'test-invit10@test.com', password: 'Test1234' })
    const newUser = (await newAx.get('/api/auth/me')).data
    assert.equal(newUser.organizations[0].name, 'test')
    assert.equal(newUser.organizations[0].department, 'dep1')
    assert.equal(newUser.organizations[0].role, 'user')

    // send a second invitation
    const mail2 = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit10@test.com', department: 'dep2', role: 'admin' })
    )
    assert.ok(mail2.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // before accepting the user is not yet member of the second department
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    assert.equal(members.filter((m: any) => m.email === 'test-invit10@test.com').length, 1)

    // when clicking on the link the person accepts the invitation and is redirected to to a page
    await assert.rejects(newAx.get(mail2.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location as string
      assert.ok(redirect.startsWith(config.publicUrl + '/invitation'))
      return true
    })

    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 3)
    assert.equal(members.filter((m: any) => m.email === 'test-invit10@test.com').length, 2)
  })

  test('should invite a new user in multiple departments with single email', async () => {
    const config = await getServerConfig()
    const { ax } = await createUser('test-invit-multi-dep1@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test-multi-dep', departments: [{ id: 'dep1', name: 'Department 1' }, { id: 'dep2', name: 'Department 2' }, { id: 'dep3', name: 'Department 3' }] })).data
    ax.setOrg(org.id)
    const mail = await waitForMail(
      () => ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit-multi-dep2@test.com', departments: ['dep1', 'dep3'], role: 'user' })
    )
    assert.equal(mail.subject, `Rejoignez l'organisation test-multi-dep (Department 1, Department 3) sur ${new URL(config.publicUrl).host}`)
    assert.ok(mail.link.startsWith(config.publicUrl + '/api/invitations/_accept'))

    // before accepting the user is not yet member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 1)

    // when clicking on the link the person is redirected to a page to create their user
    let redirect: string | undefined
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      return true
    })
    const invitToken = new URL(redirect ?? '').searchParams.get('invit_token')

    // create user and accept invitation
    await anonymousAx.post('/api/users', { email: 'test-invit-multi-dep2@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    console.log('members', members)
    assert.equal(members.length, 3)
    const newMember = members.find((m: any) => m.email === 'test-invit-multi-dep2@test.com')
    assert.ok(newMember)
    assert.ok(newMember.emailConfirmed)
    assert.equal(newMember.role, 'user')

    // user should be member of both departments
    const memberDepts = members.filter((m: any) => m.email === 'test-invit-multi-dep2@test.com')
    assert.equal(memberDepts.length, 2)
    const deptIds = memberDepts.map((m: any) => m.department).sort()
    assert.deepEqual(deptIds, ['dep1', 'dep3'])
    const deptNames = memberDepts.map((m: any) => m.departmentName).sort()
    assert.deepEqual(deptNames, ['Department 1', 'Department 3'])
  })

  test('should invite an existing user on another site', async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { ax } = await createUser('test-invit12@test.com')
    await createUser('test-invit11@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)

    await anonymousAx.post('/api/sites',
      { _id: 'test_site', owner: { type: 'organization', id: org.id, name: org.name }, host: '127.0.0.1:' + process.env.NGINX_PORT2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_site', { authMode: 'ssoBackOffice' })
    const mail = await waitForMail(
      () => ax.post('/api/invitations', {
        id: org.id,
        name: org.name,
        email: 'test-invit11@test.com',
        role: 'user',
        redirect: 'http://127.0.0.1:' + process.env.NGINX_PORT2
      })
    )
    assert.ok(mail.link.startsWith(`http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory/api/invitations/_accept`))

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith(`http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory/login?step=createUser&invit_token=`))
      return true
    })

    const invitToken = new URL(mail.link).searchParams.get('invit_token')

    // finalize user creation and invitation
    await anonymousAx.post(`http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory/api/users`, { email: 'test-invit11@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })

    // after accepting the user is a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit11@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.host, '127.0.0.1:' + process.env.NGINX_PORT2)
  })

  test('should reject duplicate invitation', async () => {
    await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })
    const { ax } = await createUser('test-invit12@test.com')
    await createUser('test-invit13@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)

    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit13@test.com', role: 'user' })

    // the user is a member
    let members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    let newMember = members.find((m: any) => m.email === 'test-invit13@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')

    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit13@test.com', role: 'admin' })

    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    newMember = members.find((m: any) => m.email === 'test-invit13@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'admin')

    await testEnvAx.patch('/config', { multiRoles: true })

    await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-invit13@test.com', role: 'user' })
    members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 3)

    await testEnvAx.patch('/config', { multiRoles: false, alwaysAcceptInvitation: false })
  })

  // TODO: depends on events service and multi-site flow through nginx
  test.skip('should invite a user on another site in onlyBackOffice mode', async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { ax } = await createUser('test-invit13@test.com')
    const anonymousAx = await axios()

    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    ax.setOrg(org.id)

    await anonymousAx.post('/api/sites',
      { _id: 'test_site', owner: { type: 'organization', id: org.id, name: org.name }, host: '127.0.0.1:' + process.env.NGINX_PORT2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_site', { authMode: 'onlyBackOffice' })
    const mail = await waitForMail(
      () => ax.post('/api/invitations', {
        id: org.id,
        name: org.name,
        email: 'test-invit14@test.com',
        role: 'user',
        redirect: 'http://127.0.0.1:' + process.env.NGINX_PORT2
      })
    )
    assert.ok(mail.link.startsWith(directoryUrl + '/api/invitations/_accept'))

    // when clicking on the link the person is redirected to a page to create their user
    // the invitation token is forwarded to be re-sent with the user creation requests
    let redirect
    await assert.rejects(anonymousAx.get(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect = res.headers.location
      assert.ok(redirect.startsWith(directoryUrl + '/login?step=createUser&invit_token='))
      const redirectUrl = new URL(redirect)
      const reboundRedirect = redirectUrl.searchParams.get('redirect')
      assert.ok(reboundRedirect?.startsWith('http://127.0.0.1:' + process.env.NGINX_PORT2))
      return true
    })

    const invitToken = new URL(mail.link).searchParams.get('invit_token')

    // finalize user creation and invitation
    await anonymousAx.post('/api/users', { email: 'test-invit14@test.com', password: 'Test1234' }, { params: { invit_token: invitToken } })

    // after accepting the user is a member
    const members = (await ax.get(`/api/organizations/${org.id}/members`)).data.results
    assert.equal(members.length, 2)
    const newMember = members.find((m: any) => m.email === 'test-invit14@test.com')
    assert.ok(newMember)
    assert.equal(newMember.role, 'user')
    assert.equal(newMember.host, undefined)

    // invite same user in another org
    const org2 = (await ax.post('/api/organizations', { name: 'test2' })).data
    ax.setOrg(org2.id)

    const mail2 = await waitForMail(
      () => ax.post('/api/invitations', {
        id: org2.id,
        name: org2.name,
        email: 'test-invit14@test.com',
        role: 'contrib',
        redirect: 'http://127.0.0.1:' + process.env.NGINX_PORT2
      })
    )
    assert.ok(mail2.link.startsWith(directoryUrl + '/api/invitations/_accept'))

    // when clicking on the link the person is redirected to a page to accept the invitation (not create the user as it already exists)
    let redirect2
    await assert.rejects(anonymousAx.get(mail2.link), (res: any) => {
      assert.equal(res.status, 302)
      redirect2 = res.headers.location
      assert.ok(redirect2.startsWith(directoryUrl + '/login?email=test-invit14'))
      const redirectUrl = new URL(redirect2)
      const reboundRedirect = redirectUrl.searchParams.get('redirect')
      assert.ok(reboundRedirect?.startsWith('http://127.0.0.1:' + process.env.NGINX_PORT2))
      return true
    })

    // after accepting the user is a member in both orgs
    const members2 = (await ax.get(`/api/organizations/${org2.id}/members`)).data.results
    assert.equal(members2.length, 2)
    const newMember2 = members2.find((m: any) => m.email === 'test-invit14@test.com')
    assert.ok(newMember2)
    assert.equal(newMember2.role, 'contrib')
    assert.equal(newMember2.host, undefined)
  })
})
