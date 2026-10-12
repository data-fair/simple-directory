import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { authenticator } from 'otplib'

test.describe('2FA codes time tolerance', () => {
  test('should accept the codes of the adjacent steps but not older ones', async () => {
    const { is2FAValid } = await import('../../api/src/2fa/service.ts')
    const secret = authenticator.generateSecret()
    const codeAt = (offset: number) => authenticator.clone({ epoch: Date.now() + offset * 1000 }).generate(secret)
    assert.ok(is2FAValid(secret, codeAt(0)))
    assert.ok(is2FAValid(secret, codeAt(-30)))
    assert.ok(is2FAValid(secret, codeAt(30)))
    assert.ok(!is2FAValid(secret, codeAt(-90)))
    assert.ok(!is2FAValid(secret, codeAt(90)))
  })
})
