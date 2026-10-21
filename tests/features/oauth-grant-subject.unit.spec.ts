import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

// NHI grants only come with the dynamic clients (a later task): their re-checks are exercised here
// directly, with a stubbed user storage and the main site as issuer
const nhiOrg = { id: 'test_gs_org', name: 'GS org', role: 'admin' }

const nhiUser = (nhi: Record<string, any> = {}, extra: Record<string, any> = {}) => ({
  id: 'nhi-test_gs',
  name: 'Agent',
  email: 'nhi-test_gs@nhi.local',
  organizations: [nhiOrg],
  nhi: { provider: { issuer: 'https://idp.example.org' }, subject: 'agent', ...nhi },
  ...extra
})

// the org admin who authorized the grant, present unless a test replaces it
const adminUser = (role = 'admin') => ({ id: 'test_gs_admin', name: 'Admin', email: 'admin@gs.local', organizations: [{ ...nhiOrg, role }] })

const nhiRecord = (resource: string, extra: Record<string, any> = {}) => ({
  _id: 'test_gs_grant',
  issuer: '',
  clientId: 'https://agent.example.org/client.json',
  clientName: 'Agent client',
  clientKind: 'cimd' as const,
  subject: { type: 'nhi' as const, id: 'nhi-test_gs' },
  account: { type: 'organization' as const, id: nhiOrg.id },
  scope: 'organizations:read organizations',
  resources: [resource],
  authorizedBy: { id: 'test_gs_admin', name: 'Admin' },
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60000),
  ...extra
})

test.describe('oauth grant subject re-checks', () => {
  test.beforeAll(async () => { await initMongo() })

  const withUsers = async (users: Record<string, any>, fn: () => Promise<void>) => {
    const storages = (await import('../../api/src/storages/index.ts')).default as any
    const previous = storages._globalStorage
    const all: Record<string, any> = { test_gs_admin: adminUser(), ...users }
    storages._globalStorage = { getUser: async (id: string) => all[id] ?? undefined }
    try {
      await fn()
    } finally {
      storages._globalStorage = previous
    }
  }

  const mainIssuer = async () => {
    const { issuerOfSite, mainSiteUrl } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = await issuerOfSite(undefined, mainSiteUrl())
    assert.ok(ctx)
    return ctx
  }

  const refused = async (promise: Promise<unknown>, reason: RegExp) => {
    const { GrantSubjectError } = await import('../../api/src/oauth-server/grant-subject.ts')
    await assert.rejects(promise, (err: any) => err instanceof GrantSubjectError && reason.test(err.message))
  }

  test('an nhi subject gets its claims, the scope narrowed to its current maximum', async () => {
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const record = nhiRecord(ctx.siteUrl, { issuer: ctx.issuer })
    await withUsers({ 'nhi-test_gs': nhiUser() }, async () => {
      const subject = await checkGrantSubject(record, ctx, '10.0.0.1')
      // unrestricted NHI: every known scope
      assert.equal(subject.scope, 'organizations:read organizations')
      assert.equal(subject.claims.nhi, 1)
      assert.deepEqual(subject.claims.organizations.map((o: any) => o.id), [nhiOrg.id])
      assert.equal(subject.claims.boundIp, undefined)
    })
    await withUsers({ 'nhi-test_gs': nhiUser({ scopes: ['organizations:read'] }) }, async () => {
      assert.equal((await checkGrantSubject(record, ctx, '10.0.0.1')).scope, 'organizations:read')
    })
    await withUsers({ 'nhi-test_gs': nhiUser({ scopes: ['other:x'] }) }, async () => {
      await refused(checkGrantSubject(record, ctx, '10.0.0.1'), /no scope left/)
    })
  })

  test('an nhi grant ends with the admin role of its authorizer', async () => {
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const record = nhiRecord(ctx.siteUrl, { issuer: ctx.issuer })
    await withUsers({ 'nhi-test_gs': nhiUser(), test_gs_admin: adminUser('user') }, async () => {
      await refused(checkGrantSubject(record, ctx, '10.0.0.1'), /authorizer/)
    })
    await withUsers({ 'nhi-test_gs': nhiUser(), test_gs_admin: undefined }, async () => {
      await refused(checkGrantSubject(record, ctx, '10.0.0.1'), /authorizer/)
    })
    // an admin of the whole org covers an nhi of one of its departments
    const depRecord = { ...record, account: { ...record.account, department: 'dep1' } }
    await withUsers({ 'nhi-test_gs': nhiUser({}, { organizations: [{ ...nhiOrg, department: 'dep1' }] }) }, async () => {
      assert.ok(await checkGrantSubject(depRecord, ctx, '10.0.0.1'))
    })
  })

  test('allowedIps is checked against the token endpoint caller', async () => {
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const record = nhiRecord(ctx.siteUrl, { issuer: ctx.issuer })
    await withUsers({ 'nhi-test_gs': nhiUser({ allowedIps: ['10.0.0.0/8'] }) }, async () => {
      assert.ok(await checkGrantSubject(record, ctx, '10.1.2.3'))
      await refused(checkGrantSubject(record, ctx, '192.168.1.1'), /allowedIps/)
    })
  })

  test('an ip bound nhi gets claims bound to the ip of the token request', async () => {
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const record = nhiRecord(ctx.siteUrl, { issuer: ctx.issuer })
    await withUsers({ 'nhi-test_gs': nhiUser({ ipBinding: true }) }, async () => {
      assert.equal((await checkGrantSubject(record, ctx, '10.0.0.1')).claims.boundIp, '10.0.0.1')
    })
  })

  test('the nhi may only target the main site or a site of its organization', async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    const { getSiteByHost } = await import('../../api/src/sites/service.ts')
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const protocol = new URL(ctx.siteUrl).protocol
    await mongo.sites.deleteMany({ _id: { $in: ['test_gs_own', 'test_gs_other'] } as any })
    await mongo.sites.insertMany([
      { _id: 'test_gs_own', host: 'gs-own.example.org', owner: { type: 'organization', id: nhiOrg.id }, authMode: 'onlyBackOffice' },
      { _id: 'test_gs_other', host: 'gs-other.example.org', owner: { type: 'organization', id: 'test_gs_other_org' }, authMode: 'onlyBackOffice' }
    ] as any[])
    getSiteByHost.clear()
    try {
      await withUsers({ 'nhi-test_gs': nhiUser() }, async () => {
        const own = await checkGrantSubject(nhiRecord(`${protocol}//gs-own.example.org`, { issuer: ctx.issuer }), ctx, '10.0.0.1')
        assert.equal(own.resource.site?._id, 'test_gs_own')
        await refused(checkGrantSubject(nhiRecord(`${protocol}//gs-other.example.org`, { issuer: ctx.issuer }), ctx, '10.0.0.1'), /not owned/)
      })
    } finally {
      await mongo.sites.deleteMany({ _id: { $in: ['test_gs_own', 'test_gs_other'] } as any })
      getSiteByHost.clear()
    }
  })

  test('the record, the subject and the bound membership must still hold', async () => {
    const { checkGrantSubject } = await import('../../api/src/oauth-server/grant-subject.ts')
    const ctx = await mainIssuer()
    const record = nhiRecord(ctx.siteUrl, { issuer: ctx.issuer })
    await withUsers({ 'nhi-test_gs': nhiUser() }, async () => {
      await refused(checkGrantSubject({ ...record, expiresAt: new Date(Date.now() - 1000) }, ctx, '10.0.0.1'), /expired/)
      await refused(checkGrantSubject({ ...record, issuer: 'https://other.example.org/simple-directory' }, ctx, '10.0.0.1'), /another issuer/)
      // a site client's grant has a user subject, a dynamic client's grant an nhi subject
      await refused(checkGrantSubject({ ...record, clientKind: 'site' }, ctx, '10.0.0.1'), /client kind/)
      await refused(checkGrantSubject({ ...record, subject: { type: 'nhi', id: 'nhi-test_gone' } }, ctx, '10.0.0.1'), /subject not found/)
      await refused(checkGrantSubject({ ...record, account: { type: 'organization', id: 'test_gs_other_org' } }, ctx, '10.0.0.1'), /membership/)
      await refused(checkGrantSubject({ ...record, account: { type: 'user', id: 'nhi-test_gs' } }, ctx, '10.0.0.1'), /bound to its organization/)
    })
    // the subject turned into a user (or the id now names a user) is refused
    await withUsers({ 'nhi-test_gs': nhiUser({}, { nhi: undefined }) }, async () => {
      await refused(checkGrantSubject(record, ctx, '10.0.0.1'), /subject type changed/)
    })
  })
})
