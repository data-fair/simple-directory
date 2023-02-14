const assert = require('assert').strict
const testUtils = require('../utils')

describe('organizations api', () => {
  it('should create an organization', async () => {
    const adminAx = global.users.admin.ax
    const { ax, user } = await testUtils.createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test' })
    const orgs = (await adminAx.get('/api/organizations')).data.results
    assert.equal(orgs.length, 1)
    assert.equal(orgs[0].name, 'test')
    const freshUser = (await ax.get('/api/users/' + user.id)).data
    assert.equal(freshUser.organizations.length, 1)
    assert.equal(freshUser.organizations[0].id, orgs[0].id)
    assert.equal(freshUser.organizations[0].name, 'test')
    assert.equal(freshUser.organizations[0].role, 'admin')
  })

  it('should create an organization with departments', async () => {
    const adminAx = global.users.admin.ax
    const { ax } = await testUtils.createUser('test-org2@test.com')
    await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }] })
    const orgs = (await adminAx.get('/api/organizations')).data.results
    assert.equal(orgs.length, 1)
    assert.equal(orgs[0].name, 'test')
    assert.ok(!orgs[0].departments)
    const detailedOrg = (await adminAx.get('/api/organizations/' + orgs[0].id)).data
    assert.equal(detailedOrg.departments.length, 1)
  })
})
