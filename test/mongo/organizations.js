const assert = require('assert').strict
const testUtils = require('../utils')

describe('organizations api', () => {
  it('should create an organization', async () => {
    const { ax: adminAx } = await testUtils.createUser('alban.mouton@koumoul.com', true)
    const { ax } = await testUtils.createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test' })
    const orgs = (await adminAx.get('/api/organizations')).data.results
    assert.equal(orgs.length, 1)
    assert.equal(orgs[0].name, 'test')
  })
})
