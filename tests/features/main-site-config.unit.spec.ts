// The MAIN_SITE_FROM_DB category list is constrained by an enum in
// api/config/type/schema.json so that a typo refuses to start the server
// rather than silently disabling a category.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

test.describe('mainSiteFromDb config', () => {
  test('defaults to an empty list', async () => {
    delete process.env.MAIN_SITE_FROM_DB
    const mod = await import(`../../api/src/config.ts?mainsite-default=${Date.now()}`)
    assert.deepEqual(mod.default.mainSiteFromDb, [])
  })

  test('accepts the four known categories', async () => {
    process.env.MAIN_SITE_FROM_DB = '["theme","title","mails","registration"]'
    const mod = await import(`../../api/src/config.ts?mainsite-ok=${Date.now()}`)
    assert.deepEqual(mod.default.mainSiteFromDb, ['theme', 'title', 'mails', 'registration'])
  })

  test('refuses an unknown category', async () => {
    process.env.MAIN_SITE_FROM_DB = '["theme","authProviders"]'
    await assert.rejects(import(`../../api/src/config.ts?mainsite-ko=${Date.now()}`))
    delete process.env.MAIN_SITE_FROM_DB
  })
})
