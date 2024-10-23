const assert = require('assert').strict
const testUtils = require('../utils')

describe('users API', () => {
  it('Get user list when not authenticated', async () => {
    const ax = await testUtils.axios()
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  it('Get user list when authenticated', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 12)
    assert.deepEqual(Object.keys(res.data.results[0]), ['id', 'name'])
  })

  it('Get filtered user list', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/users?q=Al')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 3)
  })

  it('Get user list with all fields when not admin', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/users?allFields=true'), (res) => res.status === 403)
  })

  it('Get user list with all fields as admin', async () => {
    const ax = await testUtils.axios('alban.mouton@koumoul.com:testpasswd:adminMode')
    const res = await ax.get('/api/users?allFields=true')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 12)
    assert.ok(res.data.results[0].organizations)
  })

  it('Get user info when not authenticated', async () => {
    const ax = await testUtils.axios()
    await assert.rejects(ax.get('/api/users/ccherryholme1'), (res) => res.status === 401)
  })

  it('Get user info when authenticated as another user', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/users/ccherryholme1'), (res) => res.status === 403)
  })

  it('Get user infos', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/users/dmeadus0')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })
})
