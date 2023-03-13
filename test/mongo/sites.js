const config = require('config')
const assert = require('assert').strict
const testUtils = require('../utils')

describe('sites api', () => {
  it('should create a site for a standalone portal', async () => {
    const anonymousAx = await testUtils.axios()
    await assert.rejects(anonymousAx.post('/api/sites', { host: 'test' }), (err) => err.status === 401)
    await assert.rejects(anonymousAx.post('/api/sites', { host: 'test' }, { params: { key: config.secretKeys.sites } }), (err) => err.status === 400)

    const { ax } = await testUtils.createUser('test-org@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const orgAx = await testUtils.axios('test-org@test.com:Test1234:org', org.id)
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: 'test.com', theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })

    await assert.rejects(anonymousAx.get('/api/sites'), err => err.status === 401)

    // anonymous user can access the public info (host, theme and later auth providers) so that we can display custom login page
    const publicSite = (await anonymousAx.get('/api/sites/' + encodeURIComponent('test.com'))).data
    assert.deepEqual(publicSite, { host: 'test.com', theme: { primaryColor: '#FF00FF' } })

    let sites = (await ax.get('/api/sites')).data
    assert.equal(sites.count, 0)

    sites = (await orgAx.get('/api/sites')).data
    assert.equal(sites.count, 1)
  })
})
