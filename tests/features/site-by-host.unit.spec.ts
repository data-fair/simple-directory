import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

const site = (id: string, path?: string) => ({
  _id: id, host: 'shared.example.org', owner: { type: 'organization', id: 'test_orga' }, updatedAt: new Date().toISOString(), ...(path !== undefined ? { path } : {})
})

test.describe('getSiteByHost', () => {
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    await mongo.sites.deleteMany({ _id: { $regex: /^test_/ } })
  })

  const seed = async (...docs: any[]) => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    await mongo.sites.insertMany(docs)
    const { getSiteByHost } = await import('../../api/src/sites/service.ts')
    getSiteByHost.clear()
  }

  const lookup = async (path: string) => {
    const { getSiteByHost } = await import('../../api/src/sites/service.ts')
    return (await getSiteByHost('shared.example.org', path))?._id
  }

  test('the longest matching path wins over a root site on the same host', async () => {
    // root site inserted first, so a first-match lookup would return it
    await seed(site('test_root'), site('test_portal', '/portal'))
    assert.equal(await lookup('/portal'), 'test_portal')
    assert.equal(await lookup('/portal/'), 'test_portal')
    assert.equal(await lookup('/portal/simple-directory/login'), 'test_portal')
    assert.equal(await lookup('/other'), 'test_root')
    assert.equal(await lookup(''), 'test_root')
  })

  test('a path only matches whole segments', async () => {
    await seed(site('test_portal', '/portal'), site('test_portal2', '/portal2'))
    assert.equal(await lookup('/portal2/page'), 'test_portal2')
    assert.equal(await lookup('/portal/page'), 'test_portal')
    assert.equal(await lookup('/portalx'), undefined)
  })

  test('a site path with a trailing slash still matches', async () => {
    await seed(site('test_portal', '/portal/'))
    assert.equal(await lookup('/portal'), 'test_portal')
    assert.equal(await lookup('/portal/page'), 'test_portal')
  })
})
