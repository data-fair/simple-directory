import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { initMongo } from '../support/unit.ts'

const nhi = {
  id: 'test_nhi1',
  name: 'Agent',
  email: 'nhi@test.com',
  nhi: true,
  isAdmin: true,
  organizations: [{ id: 'test_org', name: 'Org', role: 'admin' }]
} as any

const resource = (site?: any) => ({ kind: 'api' as const, site, siteUrl: 'https://portal.example.org', audience: 'https://portal.example.org' })

test.describe('oauth access token claims', () => {
  test.beforeAll(async () => { await initMongo() })

  test('sdClaims of an nhi has nhi flag, one organization, no isAdmin', async () => {
    const { sdClaims } = await import('../../api/src/oauth-server/access-token.ts')
    const claims = sdClaims(nhi, resource(), { scope: 'datasets:read', boundIp: '10.0.0.1' })
    assert.equal(claims.nhi, 1)
    assert.equal(claims.organizations.length, 1)
    assert.equal(claims.scope, 'datasets:read')
    assert.equal(claims.boundIp, '10.0.0.1')
    for (const k of ['isAdmin', 'adminMode', 'asAdmin']) assert.ok(!(k in claims), k)
    const bare = sdClaims(nhi, resource(), {})
    assert.ok(!('scope' in bare))
    assert.ok(!('boundIp' in bare))
  })

  test('sdClaims puts siteOwner of the resource site', async () => {
    const { sdClaims } = await import('../../api/src/oauth-server/access-token.ts')
    const site = { _id: 'test_s', host: 'portal.example.org', owner: { type: 'organization', id: 'test_org' } }
    assert.deepEqual(sdClaims(nhi, resource(site), {}).siteOwner, site.owner)
  })

  test('stripOidcScopes keeps platform scopes in order', async () => {
    const { stripOidcScopes } = await import('../../api/src/oauth-server/access-token.ts')
    assert.equal(stripOidcScopes('openid datasets:read offline_access organizations'), 'datasets:read organizations')
    assert.equal(stripOidcScopes('openid profile email'), '')
    assert.equal(stripOidcScopes(undefined), undefined)
  })

  test('signAccessToken header is at+jwt with a scoped kid and payload has jti', async () => {
    const keysManager = await import('../../api/src/tokens/keys-manager.ts')
    await keysManager.start()
    const { signAccessToken } = await import('../../api/src/oauth-server/access-token.ts')
    const exp = Math.floor(Date.now() / 1000) + 60
    const token = await signAccessToken({ iss: 'https://i.example.org', sub: 'test_nhi1', aud: 'https://i.example.org', client_id: 'c1' }, exp)
    const decoded = jwt.decode(token, { complete: true })!
    assert.equal(decoded.header.alg, 'RS256')
    assert.equal(decoded.header.typ, 'at+jwt')
    assert.ok(decoded.header.kid?.startsWith('scoped-'))
    const p = decoded.payload as any
    assert.ok(p.jti)
    assert.ok(p.iat)
    assert.equal(p.exp, exp)
    assert.equal(p.client_id, 'c1')
  })
})
