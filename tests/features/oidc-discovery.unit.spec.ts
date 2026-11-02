import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { resolveAuthorizationMethod, discoveryStale, refreshDiscovery } = await import('../../api/src/oauth/oidc.ts')

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000)

test.describe('OIDC client authentication method', () => {
  test('follows the discovery when nothing is configured', () => {
    assert.equal(resolveAuthorizationMethod(undefined, ['client_secret_post']), 'body')
    assert.equal(resolveAuthorizationMethod(undefined, ['client_secret_basic', 'client_secret_post']), 'header')
    assert.equal(resolveAuthorizationMethod(undefined, undefined), 'header')
  })

  test('the configured value wins', () => {
    assert.equal(resolveAuthorizationMethod('header', ['client_secret_post']), 'header')
    assert.equal(resolveAuthorizationMethod('body', ['client_secret_basic']), 'body')
  })
})

test.describe('OIDC discovery refresh', () => {
  test('staleness', () => {
    assert.equal(discoveryStale(undefined), true)
    assert.equal(discoveryStale(hoursAgo(23)), false)
    assert.equal(discoveryStale(hoursAgo(25)), true)
  })

  test('a fresh cache is not refetched', async () => {
    const fetchedAt = hoursAgo(1)
    const res = await refreshDiscovery({ content: { a: 1 }, fetchedAt }, async () => { throw new Error('should not be called') })
    assert.deepEqual(res.content, { a: 1 })
    assert.equal(res.refreshed, false)
  })

  test('a stale cache is refreshed', async () => {
    const res = await refreshDiscovery({ content: { a: 1 }, fetchedAt: hoursAgo(25) }, async () => ({ a: 2 }))
    assert.deepEqual(res.content, { a: 2 })
    assert.equal(res.refreshed, true)
  })

  test('a stale cache is kept when the fetch fails', async () => {
    const res = await refreshDiscovery({ content: { a: 1 }, fetchedAt: hoursAgo(25) }, async () => { throw new Error('down') })
    assert.deepEqual(res.content, { a: 1 })
    assert.equal(res.refreshed, false)
  })

  test('a legacy cache without date is refreshed', async () => {
    const res = await refreshDiscovery({ content: { a: 1 } }, async () => ({ a: 3 }))
    assert.deepEqual(res.content, { a: 3 })
    assert.equal(res.refreshed, true)
  })

  test('no cache and a failing fetch rejects', async () => {
    await assert.rejects(refreshDiscovery(null, async () => { throw new Error('down') }), /down/)
  })
})
