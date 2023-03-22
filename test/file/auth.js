const assert = require('assert').strict
const testUtils = require('../utils')

describe('auth', () => {
  it('Create session for known user', async () => {
    const apiDocUrl = `${require('config').publicUrl}/api/api-docs.json`
    const apiDoc = await require('axios').get(apiDocUrl)
    console.log('api doc ' + apiDocUrl, apiDoc)
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })

  it('Create session for known user, insensitive to email case', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })

  it('Do not create session for unknown user', async () => {
    await assert.rejects(testUtils.axios('notauser@test.com'), () => true)
  })

  it('Refresh token', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    let res = await ax.post('/api/auth/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie'][0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie'][1].startsWith('id_token_sign='))

    // same thing using retrocompatibility route
    res = await ax.post('/api/session/keepalive')
    assert.equal(res.status, 204)
    assert.ok(res.headers['set-cookie'][0].startsWith('id_token='))
    assert.ok(res.headers['set-cookie'][1].startsWith('id_token_sign='))
  })
})
