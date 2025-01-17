import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer, passwordLogin } from './utils/index.ts'

describe('Session management', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('Create session for known user', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })

  it('Create session for known user, insensitive to email case', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })

  it('Do not create session for unknown user', async () => {
    await assert.rejects(axiosAuth('notauser@test.com'), () => true)
  })

  it('Refresh token', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.post('/api/auth/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie']?.[0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie']?.[1].startsWith('id_token_sign='))

    // same thing using retrocompatibility route
    /* res = await ax.post('/api/session/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie']?.[0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie']?.[1].startsWith('id_token_sign=')) */
  })

  it('Store a user sessions info', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    let user = (await ax.get('/api/users/dmeadus0')).data
    assert.equal(user.email, 'dmeadus0@answers.com')
    assert.equal(user.sessions.length, 1)
    const session1 = user.sessions[0]

    // another connection with same user should create a second session
    await axiosAuth('dmeadus0@answers.com')
    user = (await ax.get('/api/users/dmeadus0')).data
    assert.equal(user.sessions.length, 2)
    const sessionAlt = user.sessions[1]
    assert.ok(session1.id === user.sessions[0].id)
    assert.ok(session1.id !== sessionAlt.id)

    // reconnecting should automatically close previous sessions
    await passwordLogin(ax, 'dmeadus0@answers.com', 'TestPasswd01')
    user = (await ax.get('/api/users/dmeadus0')).data
    assert.equal(user.sessions.length, 2)
    const session2 = user.sessions[1]
    assert.ok(session1.id !== session2.id)
    assert.ok(sessionAlt.id !== session2.id)
    assert.ok(sessionAlt.id === user.sessions[0].id)

    // deleting session should make it unusable
    const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    await adminAx.delete('/api/users/dmeadus0/sessions/' + session2.id)
    user = (await ax.get('/api/users/dmeadus0')).data
    assert.equal(user.sessions.length, 1)
    await assert.rejects(ax.post('/api/auth/keepalive'), { status: 401 })
    await assert.rejects(ax.get('/api/users/dmeadus0'), { status: 401 })

    // failing to send exchange token shoulb be a 401
    await passwordLogin(ax, 'dmeadus0@answers.com', 'TestPasswd01')
    user = (await ax.get('/api/users/dmeadus0')).data
    assert.equal(user.sessions.length, 2)
    await ax.post('/api/auth/keepalive')
    ax.cookieJar.setCookie('id_token_ex=; Path=/simple-directory/', 'http://localhost')
    await assert.rejects(ax.post('/api/auth/keepalive'), { status: 401 })
  })

  it('Toggle admin mode', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    const res = await ax.get('/api/users?allFields=true')
    assert.equal(res.status, 200)
    let me = (await ax.get('/api/auth/me')).data
    assert.ok(me.adminMode)
    await ax.delete('/api/auth/adminmode')
    me = (await ax.get('/api/auth/me')).data
    assert.ok(!me.adminMode)
    await assert.rejects(ax.get('/api/users?allFields=true'), { status: 403 })
  })

  it('Toggle asAdmin mode', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    await ax.post('/api/auth/asadmin', { id: 'dmeadus0' })
    let me = (await ax.get('/api/auth/me')).data
    assert.equal(me.id, 'dmeadus0')
    assert.equal(me.asAdmin?.id, 'superadmin')
    assert.ok(!me.adminMode)
    await ax.post('/api/auth/keepalive')
    await ax.post('/api/auth/keepalive')
    me = (await ax.get('/api/auth/me')).data
    assert.equal(me.id, 'dmeadus0')
    await ax.delete('/api/auth/asadmin')
    me = (await ax.get('/api/auth/me')).data
    assert.equal(me.id, 'superadmin')
    assert.ok(me.adminMode)
  })
})
