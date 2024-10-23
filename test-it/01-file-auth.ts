import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

describe('auth', () => {
  before(startApiServer)
  beforeEach(clean)
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
    let res = await ax.post('/api/auth/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie']?.[0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie']?.[1].startsWith('id_token_sign='))

    // same thing using retrocompatibility route
    res = await ax.post('/api/session/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie']?.[0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie']?.[1].startsWith('id_token_sign='))
  })
})
