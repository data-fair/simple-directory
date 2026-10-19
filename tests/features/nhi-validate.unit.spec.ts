import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

// validateNewNhi is reused by the consent screen (inline NHI creation)
test.describe('validateNewNhi', () => {
  test.beforeAll(async () => { await initMongo() })

  test('accepts a body without key binding, refuses a half binding', async () => {
    const { validateNewNhi } = await import('../../api/src/nhis/service.ts')
    const org = { id: 'test_validate_nhi', name: 'Validate org' } as any
    const req = {} as any
    await validateNewNhi(req, org, { name: 'oauth only', role: 'user' })
    await assert.rejects(validateNewNhi(req, org, { name: 'x', role: 'user', subject: 's' }), (err: any) => err.status === 400)
    await assert.rejects(validateNewNhi(req, org, { name: 'x', role: 'user', provider: { issuer: 'https://i.example.com' } }), (err: any) => err.status === 400)
    await assert.rejects(validateNewNhi(req, org, { name: 'x', role: 'nope' }), (err: any) => err.status === 400)
  })
})
