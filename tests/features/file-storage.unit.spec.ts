import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

// These tests exercise the file storage implementation directly (no HTTP server needed)
process.env.STORAGE_TYPE = 'file'

test.describe('file storage interface', () => {
  let storage: any
  let storages: any

  test.beforeAll(async () => {
    await initMongo()
    storages = (await import('../../api/src/storages/index.ts')).default
    await storages.init()
    storage = storages.globalStorage
  })

  test.afterAll(async () => {
    if (storages?.close) await storages.close()
    // Don't close mongo here — other unit test files share the same worker
  })

  test('Find users from storage', async () => {
    let res = await storage.findUsers({ skip: 0, size: 10 })
    assert.equal(res.count, 12)
    assert.ok(res.results[0].id)
    assert.ok(res.results[0].email)
    res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(res.count, 1)
  })

  test('Find members from storage', async () => {
    const res = await storage.findMembers('test_KWqAGZ4mG', { skip: 0, size: 10 })
    assert.equal(res.count, 2)
  })

  test('Get user from storage', async () => {
    const res = await storage.getUser('test_dmeadus0')
    assert.ok(res)
    assert.ok(res.email)
    assert.ok(res.organizations)
    assert.equal(res.organizations.length, 3)
    assert.equal(res.organizations[0].name, 'Fivechat')
    assert.equal(res.organizations[0].role, 'admin')
  })
})
