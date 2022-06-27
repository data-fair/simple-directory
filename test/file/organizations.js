const assert = require('assert').strict
const testUtils = require('../utils')

describe('organizations API', () => {
  it('Get organization list when not authenticated', async () => {
    const ax = await testUtils.axios()
    const res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  it('Get organization list when authenticated', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    let res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 7)
    res = await ax.get('/api/organizations?q=li')
    assert.equal(res.data.count, 2)
  })

  it('Get organization list when authenticated with api key', async () => {
    const ax = await testUtils.axios()
    const res = await ax.get('/api/organizations?apiKey=testkey')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 7)
  })

  it('Get organization roles', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/3sSi7xDIK/roles')
    assert.equal(res.status, 200)
    assert.equal(res.data.length, 2)
  })

  it('Cannot get organization roles when non member', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/ihMQiGTaY/roles')
    assert.equal(res.status, 403)
  })
})
