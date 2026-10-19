// A session key id starting with `scoped-` would be looked up by the libs in the scoped key set,
// so the service must refuse to start with such a kid.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

test.describe('keys manager kid', () => {
  test('refuses to start when config.kid starts with scoped-', async () => {
    const { default: config } = await import('../../api/src/config.ts')
    const keysManager = await import('../../api/src/tokens/keys-manager.ts')
    const descriptor = Object.getOwnPropertyDescriptor(config, 'kid')!
    try {
      // 'scoped' too: session kids are kid + '-' + uuid, which would start with 'scoped-'
      for (const kid of ['scoped-x', 'scoped']) {
        Object.defineProperty(config, 'kid', { value: kid, writable: true, configurable: true })
        await assert.rejects(keysManager.start(), /kid.*scoped-/)
      }
    } finally {
      // the unit tests share one worker, later ones start the keys manager with the real kid
      Object.defineProperty(config, 'kid', descriptor)
    }
  })
})
