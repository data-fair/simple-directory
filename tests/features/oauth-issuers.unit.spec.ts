import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

const site = (id: string, host: string, owner: string, extra: any = {}) => ({
  _id: id, host, owner: { type: 'organization', id: owner }, updatedAt: new Date().toISOString(), ...extra
})

test.describe('oauth server issuers and resources', () => {
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    await mongo.sites.deleteMany({ _id: { $regex: /^test_/ } })
    const { getSiteByHost } = await import('../../api/src/sites/service.ts')
    getSiteByHost.clear()
  })

  const seed = async (...docs: any[]) => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    await mongo.sites.insertMany(docs)
    const { getSiteByHost } = await import('../../api/src/sites/service.ts')
    getSiteByHost.clear()
  }

  const portal = site('test_portal', 'portal.example.org', 'test_orga', { authMode: 'onlyLocal', isAccountMain: true })
  const portalUrl = 'https://portal.example.org'

  test('main site is an issuer', async () => {
    const config = (await import('../../api/src/config.ts')).default
    const { issuerOfSite, mainSiteUrl } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = await issuerOfSite(undefined, mainSiteUrl())
    assert.ok(ctx)
    assert.equal(ctx.issuer, config.publicUrl.replace(/\/$/, ''))
    assert.equal(ctx.site, undefined)
  })

  test('isAccountMain site is an issuer with its own url', async () => {
    await seed(portal)
    const { issuerOfSite } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = await issuerOfSite(portal as any, portalUrl)
    assert.equal(ctx?.issuer, 'https://portal.example.org/simple-directory')
    assert.equal(ctx?.siteUrl, portalUrl)
  })

  test('onlyLocal site is an issuer only without an isAccountMain sibling', async () => {
    const { issuerOfSite } = await import('../../api/src/oauth-server/issuers.ts')
    const alone = site('test_alone', 'alone.example.org', 'test_solo', { authMode: 'onlyLocal' })
    await seed(alone)
    assert.ok(await issuerOfSite(alone as any, 'https://alone.example.org'))
    const sibling = site('test_sib', 'sib.example.org', 'test_orga', { authMode: 'onlyLocal' })
    await seed(portal, sibling)
    assert.equal(await issuerOfSite(sibling as any, 'https://sib.example.org'), null)
  })

  test('onlyOtherSite site is not an issuer', async () => {
    const { issuerOfSite } = await import('../../api/src/oauth-server/issuers.ts')
    const s = site('test_other', 'other.example.org', 'test_orga', { authMode: 'onlyOtherSite', authOnlyOtherSite: 'portal.example.org' })
    await seed(portal, s)
    assert.equal(await issuerOfSite(s as any, 'https://other.example.org'), null)
  })

  test('ssoBackOffice site is not an issuer', async () => {
    const { issuerOfSite } = await import('../../api/src/oauth-server/issuers.ts')
    const s = site('test_sso', 'sso.example.org', 'test_orga2', { authMode: 'ssoBackOffice' })
    await seed(s)
    assert.equal(await issuerOfSite(s as any, 'https://sso.example.org'), null)
  })

  test('api resource of a realm site resolves', async () => {
    const other = site('test_other', 'other.example.org', 'test_orga', { authMode: 'onlyOtherSite', authOnlyOtherSite: 'portal.example.org' })
    await seed(portal, other)
    const { issuerOfSite, resolveResource } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    const r = await resolveResource(ctx, 'https://other.example.org')
    assert.equal(r.kind, 'api')
    assert.equal(r.site?._id, 'test_other')
    assert.equal(r.audience, 'https://other.example.org')
    const self = await resolveResource(ctx, portalUrl)
    assert.equal(self.site?._id, 'test_portal')
  })

  test('mcp resource resolves to two audiences', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    const r = await resolveResource(ctx, 'https://portal.example.org/mcp-server/mcp')
    assert.equal(r.kind, 'mcp')
    assert.deepEqual(r.audience, ['https://portal.example.org/mcp-server', 'https://portal.example.org'])
  })

  test('datasets mcp alias resolves like mcp', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    const r = await resolveResource(ctx, 'https://portal.example.org/mcp-server/datasets/mcp')
    assert.equal(r.kind, 'mcp')
    assert.deepEqual(r.audience, ['https://portal.example.org/mcp-server', 'https://portal.example.org'])
  })

  test('main site resource resolves with mcp audiences', async () => {
    const { issuerOfSite, resolveResource, mainSiteUrl } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(undefined, mainSiteUrl()))!
    const r = await resolveResource(ctx, ctx.siteUrl + '/mcp-server/mcp')
    assert.equal(r.site, undefined)
    assert.deepEqual(r.audience, [ctx.siteUrl + '/mcp-server', ctx.siteUrl])
  })

  test('trailing slash and host case normalize', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    const r = await resolveResource(ctx, 'https://PORTAL.example.org/')
    assert.equal(r.audience, portalUrl)
  })

  test('query string, fragment and wrong scheme are refused', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource, ResourceError } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    for (const bad of ['https://portal.example.org?a=1', 'https://portal.example.org#x', 'http://portal.example.org', 'not a url']) {
      await assert.rejects(resolveResource(ctx, bad), ResourceError)
    }
  })

  test('malformed paths are refused or canonical', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource, ResourceError } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    await assert.rejects(resolveResource(ctx, 'https://portal.example.org//mcp-server/mcp'), ResourceError)
    await assert.rejects(resolveResource(ctx, 'https://mcp-server/mcp-server/mcp'), ResourceError)
    await assert.rejects(resolveResource(ctx, 'https://user:pw@portal.example.org'), ResourceError)
    // dot segments are collapsed by URL parsing
    const r = await resolveResource(ctx, 'https://portal.example.org/mcp-server/../')
    assert.equal(r.kind, 'api')
    assert.equal(r.audience, portalUrl)
  })

  test('non default port and site path match exactly', async () => {
    const pathSite = site('test_path', 'paths.example.org', 'test_orga5', { authMode: 'onlyLocal', isAccountMain: true, path: '/sub' })
    const portSite = site('test_port', 'port.example.org', 'test_orga6', { authMode: 'onlyLocal', isAccountMain: true })
    await seed(pathSite, portSite)
    const { issuerOfSite, resolveResource, ResourceError } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(pathSite as any, 'https://paths.example.org/sub'))!
    assert.equal((await resolveResource(ctx, 'https://paths.example.org/sub/')).audience, 'https://paths.example.org/sub')
    const m = await resolveResource(ctx, 'https://paths.example.org/sub/mcp-server/mcp')
    assert.deepEqual(m.audience, ['https://paths.example.org/sub/mcp-server', 'https://paths.example.org/sub'])
    await assert.rejects(resolveResource(ctx, 'https://paths.example.org/sub/other'), ResourceError)
    await assert.rejects(resolveResource(ctx, 'https://paths.example.org'), ResourceError)
    const pctx = (await issuerOfSite(portSite as any, 'https://port.example.org:8443'))!
    assert.equal(pctx.siteUrl, 'https://port.example.org:8443')
    assert.equal(pctx.issuer, 'https://port.example.org:8443/simple-directory')
  })

  test('isAccountMain site without own auth is not an issuer', async () => {
    const { issuerOfSite } = await import('../../api/src/oauth-server/issuers.ts')
    const s = site('test_nobo', 'nobo.example.org', 'test_orga7', { authMode: 'onlyBackOffice', isAccountMain: true })
    await seed(s)
    assert.equal(await issuerOfSite(s as any, 'https://nobo.example.org'), null)
  })

  test('site of another realm is refused', async () => {
    const foreign = site('test_foreign', 'foreign.example.org', 'test_orga3', { authMode: 'onlyLocal', isAccountMain: true })
    await seed(portal, foreign)
    const { issuerOfSite, resolveResource, ResourceError, mainSiteUrl } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    await assert.rejects(resolveResource(ctx, 'https://foreign.example.org'), ResourceError)
    await assert.rejects(resolveResource(ctx, 'https://unknown.example.org'), ResourceError)
    // and the main realm cannot target a portal either
    const mainCtx = (await issuerOfSite(undefined, mainSiteUrl()))!
    await seed(site('test_portal_http', 'portalhttp.example.org', 'test_orga4', { authMode: 'onlyLocal', isAccountMain: true }))
    await assert.rejects(resolveResource(mainCtx, mainCtx.siteUrl.replace(/\/\/.*/, '//portalhttp.example.org')), ResourceError)
  })

  test('no resource means the issuer api', async () => {
    await seed(portal)
    const { issuerOfSite, resolveResource } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = (await issuerOfSite(portal as any, portalUrl))!
    const r = await resolveResource(ctx, undefined)
    assert.equal(r.kind, 'api')
    assert.equal(r.audience, portalUrl)
    assert.equal(r.site?._id, 'test_portal')
  })

  test('nhi of another org cannot target an org-owned site', async () => {
    const { assertNhiMayTarget, ResourceError } = await import('../../api/src/oauth-server/issuers.ts')
    const nhi: any = { id: 'test_nhi', nhi: {}, organizations: [{ id: 'test_orga' }] }
    const mk = (s: any) => ({ kind: 'api' as const, site: s, siteUrl: 'x', audience: 'x' })
    assertNhiMayTarget(nhi, mk(undefined))
    assertNhiMayTarget(nhi, mk(portal))
    assert.throws(() => assertNhiMayTarget({ ...nhi, organizations: [{ id: 'test_other' }] }, mk(portal)), ResourceError)
  })

  test('department-tolerant ownership', async () => {
    const { siteOwnedByNhiOrg } = await import('../../api/src/oauth-server/issuers.ts')
    const s = (dep?: string) => ({ owner: { type: 'organization', id: 'o', department: dep } }) as any
    assert.ok(siteOwnedByNhiOrg(s(), { id: 'o', department: 'd1' } as any))
    assert.ok(siteOwnedByNhiOrg(s('d1'), { id: 'o' } as any))
    assert.ok(siteOwnedByNhiOrg(s('d1'), { id: 'o', department: 'd1' } as any))
    assert.ok(!siteOwnedByNhiOrg(s('d2'), { id: 'o', department: 'd1' } as any))
    assert.ok(!siteOwnedByNhiOrg({ owner: { type: 'user', id: 'o' } } as any, { id: 'o' } as any))
  })
})
