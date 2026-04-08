import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, clean, createUser, deleteAllEmails, getAllEmails } from '../support/axios.ts'

test.describe('users api', () => {
  test.beforeEach(async () => {
    await clean()
    await deleteAllEmails()
  })

  test('should create a user', async () => {
    const config = (await import('../../api/src/config.ts')).default
    const ax = await axios()

    // create user via API
    await ax.post('/api/users', { email: 'user@test.com', password: 'Test1234' })

    // poll maildev for the confirmation mail
    let mail: any
    for (let i = 0; i < 100; i++) {
      const emails = await getAllEmails()
      mail = emails.find((m: any) => {
        const to = m.to?.[0]?.address || m.headers?.to
        return to === 'user@test.com' || (typeof to === 'string' && to.includes('user@test.com'))
      })
      if (mail) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(mail, 'no confirmation mail received for user@test.com')

    // extract token_callback link from mail HTML
    const html: string = mail.html || mail.text
    const linkMatch = html.match(/href="([^"]*token_callback[^"]*)"/)
    assert.ok(linkMatch, 'no token_callback link found in mail')
    const link = linkMatch[1].replace(/&amp;/g, '&')

    await assert.rejects(ax(link), (res: any) => {
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
    let users = (await adminAx.get('/api/users')).data
    assert.equal(users.results.length, 2)
    users = (await adminAx.get('/api/users?q=use')).data
    assert.equal(users.results.length, 1)
  })

  test('should send an email to confirm new password', async () => {
    const config = (await import('../../api/src/config.ts')).default
    const ax = await axios()
    const { user } = await createUser('user2@test.com')

    await deleteAllEmails()
    await ax.post('/api/auth/action', { email: 'user2@test.com', action: 'changePassword', target: config.publicUrl + '/login' })

    // poll maildev for the action mail
    let mail: any
    for (let i = 0; i < 100; i++) {
      const emails = await getAllEmails()
      mail = emails.find((m: any) => {
        const html: string = m.html || m.text || ''
        return html.includes('action_token')
      })
      if (mail) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(mail, 'no action mail received')

    const mailHtml: string = mail.html || mail.text
    const actionLinkMatch = mailHtml.match(/href="([^"]*action_token[^"]*)"/)
    assert.ok(actionLinkMatch, 'no action_token link found in mail')
    const actionLink = actionLinkMatch[1].replace(/&amp;/g, '&')
    assert.ok(actionLink.includes('action_token'))
    const actionToken = (new URL(actionLink)).searchParams.get('action_token')

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
    const config = (await import('../../api/src/config.ts')).default
    const anonymousAx = await axios()
    const { user, ax } = await createUser('user3@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: '127.0.0.1:' + process.env.NGINX_PORT2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })

    await deleteAllEmails()
    await anonymousAx.post(`http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory/api/auth/action`, { email: 'user3@test.com', action: 'changePassword', target: config.publicUrl + '/login' })

    // poll maildev for the action mail
    let mail: any
    for (let i = 0; i < 100; i++) {
      const emails = await getAllEmails()
      mail = emails.find((m: any) => {
        const html: string = m.html || m.text || ''
        return html.includes('action_token')
      })
      if (mail) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(mail, 'no action mail received')

    const mailHtml: string = mail.html || mail.text
    const actionLinkMatch = mailHtml.match(/href="([^"]*action_token[^"]*)"/)
    assert.ok(actionLinkMatch, 'no action_token link found in mail')
    const actionLink = actionLinkMatch[1].replace(/&amp;/g, '&')
    const actionToken = (new URL(actionLink)).searchParams.get('action_token')
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

    const mongo = (await (import('../../api/src/mongo.ts'))).default
    // half a day later, still ok
    await mongo.db.collection('users').updateOne({ email: 'user4@test.com' }, { $set: { 'passwordUpdate.last': new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.5).toISOString() } })
    loginRes = (await ax.post('/api/auth/password', { email: 'user4@test.com', password: 'TestPasswd01' })).data
    assert.ok(loginRes.includes('token_callback'))

    // 2 days later, need to change password
    await mongo.db.collection('users').updateOne({ email: 'user4@test.com' }, { $set: { 'passwordUpdate.last': new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() } })
    await assert.rejects(ax.post('/api/auth/password', { email: 'user4@test.com', password: 'TestPasswd01' }), { status: 400 })
  })
})
