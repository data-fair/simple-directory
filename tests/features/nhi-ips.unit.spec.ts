import { test } from '@playwright/test'
import assert from 'node:assert/strict'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { ipAllowed, checkAllowedIps } = await import('../../api/src/nhis/ips.ts')

test('an exact ipv4 entry matches only that address', async () => {
  assert.equal(ipAllowed('203.0.113.5', ['203.0.113.5']), true)
  assert.equal(ipAllowed('203.0.113.6', ['203.0.113.5']), false)
})

test('an ipv4 subnet entry matches addresses inside it', async () => {
  assert.equal(ipAllowed('10.4.2.9', ['10.4.0.0/16']), true)
  assert.equal(ipAllowed('10.5.2.9', ['10.4.0.0/16']), false)
})

test('an ipv6 subnet entry matches addresses inside it', async () => {
  assert.equal(ipAllowed('2001:db8::42', ['2001:db8::/32']), true)
  assert.equal(ipAllowed('2001:db9::42', ['2001:db8::/32']), false)
})

test('an ipv4-mapped ipv6 client address matches an ipv4 entry', async () => {
  assert.equal(ipAllowed('::ffff:10.4.2.9', ['10.4.0.0/16']), true)
  assert.equal(ipAllowed('::ffff:10.5.2.9', ['10.4.0.0/16']), false)
})

test('any entry of the list is enough to match', async () => {
  const list = ['203.0.113.5', '10.4.0.0/16', '2001:db8::/32']
  assert.equal(ipAllowed('10.4.2.9', list), true)
  assert.equal(ipAllowed('2001:db8::42', list), true)
  assert.equal(ipAllowed('198.51.100.1', list), false)
})

test('an empty allowlist matches nothing', async () => {
  // fail closed: callers must treat "no allowlist configured" as a separate case, an
  // empty list must never be read as "everything is allowed"
  assert.equal(ipAllowed('203.0.113.5', []), false)
})

test('a malformed client address matches nothing', async () => {
  assert.equal(ipAllowed('not-an-ip', ['0.0.0.0/0']), false)
})

test('checkAllowedIps accepts addresses and subnets of both families', async () => {
  checkAllowedIps(['203.0.113.5', '10.4.0.0/16', '2001:db8::1', '2001:db8::/32'])
})

test('checkAllowedIps rejects a malformed entry', async () => {
  assert.throws(() => checkAllowedIps(['10.4.0.0/16', 'nonsense']), (err: any) => err.status === 400)
  assert.throws(() => checkAllowedIps(['10.4.0.0/33']), (err: any) => err.status === 400)
  assert.throws(() => checkAllowedIps(['2001:db8::/129']), (err: any) => err.status === 400)
  assert.throws(() => checkAllowedIps(['10.4.0.0/']), (err: any) => err.status === 400)
})

test('checkAllowedIps rejects an empty list', async () => {
  // an NHI with an empty allowedIps array would be indistinguishable from an unrestricted
  // one at exchange time; the field must be absent instead
  assert.throws(() => checkAllowedIps([]), (err: any) => err.status === 400)
})
