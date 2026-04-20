import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, deleteAllEmails, waitForMail, getServerConfig } from '../support/axios.ts'

test.describe('users api', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
  })

  test('should create a user', async () => {
    const config = await getServerConfig()
    const ax = await axios()

    const token = (await ax.get('/api/auth/anonymous-action')).data

    // create user via API and wait for confirmation mail via SSE
    const mail = await waitForMail(
      () => ax.post('/api/users', { email: 'user@test.com', password: 'Test1234', token }),
      (m) => m.to === 'user@test.com' && m.link?.includes('token_callback')
    )

    await assert.rejects(ax(mail.link), (res: any) => {
      assert.equal(res.status, 302)
      // redirect to login page on the createOrga step
      assert.ok(res.headers.location.startsWith(config.publicUrl + '/login?step=createOrga'))

      // auto login of the created user
      assert.ok(res.headers.location)
      assert.ok(res.headers['set-cookie'].find((c: string) => c.startsWith('id_token=')))
      assert.ok(res.headers['set-cookie'].find((c: string) => c.startsWith('id_token_sign=')))
      return true
    })

    const { ax: adminAx } = await createUser('admin@test.com', true)
    let users = (await adminAx.get('/api/users?allFields=true&size=100')).data
    assert.ok(users.count >= 2)
    assert.ok(users.results.find((u: any) => u.email === 'user@test.com'))
    assert.ok(users.results.find((u: any) => u.email === 'admin@test.com'))
    users = (await adminAx.get('/api/users?q=user%40test.com')).data
    assert.ok(users.results.length >= 1)
  })

  test('should send an email to confirm new password', async () => {
    const config = await getServerConfig()
    const ax = await axios()
    const { user } = await createUser('user2@test.com')

    const mail = await waitForMail(
      () => ax.post('/api/auth/action', { email: 'user2@test.com', action: 'changePassword', target: config.publicUrl + '/login' }),
      (m) => m.to === 'user2@test.com' && m.link?.includes('action_token')
    )
    const actionToken = (new URL(mail.link)).searchParams.get('action_token')

    // not strong enough
    await assert.rejects(ax.post(
      `/api/users/${user.id}/password`,
      { password: 'test' },
      { params: { action_token: actionToken } }
    ), { status: 400 })

    // not changed
    await assert.rejects(ax.post(
      `/api/users/${user.id}/password`,
      { password: 'TestPasswd01' },
      { params: { action_token: actionToken } }
    ), { status: 400 })

    // actually change password
    await ax.post(
      `/api/users/${user.id}/password`,
      { password: 'TestPassword01' },
      { params: { action_token: actionToken } }
    )
    const loginRes = (await ax.post('/api/auth/password', { email: 'user2@test.com', password: 'TestPassword01' })).data
    assert.ok(loginRes.includes('token_callback'))
  })

  test('should send an email to confirm new host if user exists on main host', async () => {
    const config = await getServerConfig()
    const anonymousAx = await axios()
    const { user, ax } = await createUser('user3@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test_site', owner, host: '127.0.0.1:' + process.env.NGINX_PORT2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })

    const mail2 = await waitForMail(
      () => anonymousAx.post(`http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory/api/auth/action`, { email: 'user3@test.com', action: 'changePassword', target: config.publicUrl + '/login' }),
      (m) => m.to === 'user3@test.com' && m.link?.includes('action_token')
    )
    const actionToken = (new URL(mail2.link)).searchParams.get('action_token')
    await assert.rejects(ax.post(
      `/api/users/${user.id}/password`,
      { password: 'test.com' },
      { params: { action_token: actionToken } }
    ), { status: 401 })

    await ax.post(
      `/api/users/${user.id}/host`,
      { host: '127.0.0.1:' + process.env.NGINX_PORT2 },
      { params: { action_token: actionToken } }
    )
  })

  test('should force a user to change their password after delay', async () => {
    const ax = await axios()
    await createUser('user4@test.com')
    let loginRes = (await ax.post('/api/auth/password', { email: 'user4@test.com', password: 'TestPasswd01' })).data
    assert.ok(loginRes.includes('token_callback'))

    // half a day later, still ok
    await testEnvAx.patch('/user/' + encodeURIComponent('user4@test.com'), { 'passwordUpdate.last': new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.5).toISOString() })
    loginRes = (await ax.post('/api/auth/password', { email: 'user4@test.com', password: 'TestPasswd01' })).data
    assert.ok(loginRes.includes('token_callback'))

    // 2 days later, need to change password
    await testEnvAx.patch('/user/' + encodeURIComponent('user4@test.com'), { 'passwordUpdate.last': new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() })
    await assert.rejects(ax.post('/api/auth/password', { email: 'user4@test.com', password: 'TestPasswd01' }), { status: 400 })
  })
})
