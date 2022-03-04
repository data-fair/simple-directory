const assert = require('assert').strict

describe('storage file', () => {
  it('Find users', async () => {
    let res = await global.app.get('storage').findUsers({ skip: 0, size: 10 })
    assert.equal(res.count, 12)
    assert.ok(res.results[0].id)
    assert.ok(res.results[0].email)
    res = await global.app.get('storage').findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(res.count, 1)
  })

  it('Find members', async () => {
    const res = await global.app.get('storage').findMembers('KWqAGZ4mG', { skip: 0, size: 10 })
    assert.equal(res.count, 2)
  })

  it('Get user', async () => {
    const res = await global.app.get('storage').getUser({ id: 'dmeadus0' })
    assert.ok(res)
    assert.ok(res.email)
    assert.ok(res.organizations)
    assert.equal(res.organizations.length, 3)
    assert.equal(res.organizations[0].name, 'Fivechat')
    assert.equal(res.organizations[0].role, 'admin')
  })
})
