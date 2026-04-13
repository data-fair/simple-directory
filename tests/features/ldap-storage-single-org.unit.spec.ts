import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo, clean } from '../support/unit.ts'

let ldapConfig: any

test.describe('ldap single org', () => {
  test.beforeAll(async () => {
    await initMongo()
    const config = (await import('../../api/src/config.ts')).default
    ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
    ldapConfig.cacheMS = 0
    ldapConfig.organizations.staticSingleOrg = { id: 'test-single-org', name: 'Test single org' }
    ldapConfig.members.role.values = { admin: ['administrator'], user: [] }
    delete ldapConfig.members.role.captureRegex
  })
  test.beforeEach(async () => {
    await clean()
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)
    // Delete all users visible in single-org mode
    const allUsers = await storage.findUsers({ skip: 0, size: 1000 })
    for (const user of allUsers.results) {
      try { await storage._deleteUser(user.id) } catch (_e) { /* ignore */ }
    }
    storage.clearCache()
  })
  // Don't close mongo here — other unit test files share the same worker

  test('create and find users in static single org', async () => {
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)

    await storage._createUser({
      id: 'alban1',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'test-single-org', role: 'admin', name: 'test single org' }]
    })
    const users = await storage.findUsers({ skip: 0, size: 10 })
    assert.equal(users.count, 1)
    assert.ok(users.results[0].id)
    assert.ok(users.results[0].email)
    const users2 = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
    assert.equal(users2.count, 0)
    const users3 = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(users3.count, 1)

    const user = await storage.getUser(users3.results[0].id)
    assert.ok(user)
    assert.equal(user.organizations.length, 1)
    assert.equal(user.organizations[0].id, 'test-single-org')
    assert.equal(user.organizations[0].name, 'Test single org')
    assert.equal(user.organizations[0].role, 'admin')

    const members = await storage.findMembers('test-single-org', { skip: 0, size: 10 })
    assert.equal(members.count, 1)
    assert.equal(members.results[0].name, 'Alban Mouton')
    assert.equal(members.results[0].role, 'admin')

    const member2 = await storage.findMembers('test-single-org', { q: 'notauser', skip: 0, size: 10 })
    assert.equal(member2.count, 0)
    const members3 = await storage.findMembers('test-single-org', { q: 'alba', skip: 0, size: 10 })
    assert.equal(members3.count, 1)
  })
})
