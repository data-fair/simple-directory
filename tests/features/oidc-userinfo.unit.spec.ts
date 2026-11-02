import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { parseUserInfoResponse } = await import('../../api/src/oauth/oidc.ts')

test.describe('OIDC userinfo response parsing', () => {
  test('reads a JSON response', () => {
    assert.deepEqual(parseUserInfoResponse('{"sub":"1","email":"a@test.com"}', 'application/json; charset=utf-8'), { sub: '1', email: 'a@test.com' })
  })

  test('decodes a signed JWT response (ProConnect)', () => {
    const body = jwt.sign({ sub: '1', email: 'a@test.com', usual_name: 'Dupont' }, 'secret')
    const claims = parseUserInfoResponse(body + '\n', 'application/jwt; charset=utf-8')
    assert.equal(claims?.email, 'a@test.com')
    assert.equal(claims?.usual_name, 'Dupont')
  })

  test('returns undefined on unreadable responses so that userInfo falls back to the id_token', () => {
    assert.equal(parseUserInfoResponse('', 'application/json'), undefined)
    assert.equal(parseUserInfoResponse('not json', 'text/plain'), undefined)
    assert.equal(parseUserInfoResponse('"a string"', 'application/json'), undefined)
    assert.equal(parseUserInfoResponse('not.a.jwt', 'application/jwt'), undefined)
  })
})
