import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

const consent = () => import('../../api/src/oauth-server/consent.ts')
const scopes = () => import('../../api/src/nhis/scopes.ts')

const user = (extra: Record<string, any> = {}): any => ({
  id: 'u1',
  name: 'User 1',
  email: 'u1@test.com',
  organizations: [],
  ...extra
})

test.describe('oauth consent rules', () => {
  test('narrowScope keeps the requested scopes covered by the maximum', async () => {
    const { narrowScope } = await scopes()
    assert.deepEqual(narrowScope(['datasets:read', 'organizations:read', 'x:y'], ['datasets', 'organizations:read'], []), ['datasets:read', 'organizations:read'])
    assert.deepEqual(narrowScope(['a:b', 'c:d'], undefined, ['a:b']), ['a:b'])
    assert.deepEqual(narrowScope([], ['a:b'], ['a:b']), [])
    // request order, deduplicated
    assert.deepEqual(narrowScope(['c:d', 'a:b', 'c:d'], ['a', 'c'], []), ['c:d', 'a:b'])
  })

  test('a global tier scope of the maximum covers the tiers at or below its own', async () => {
    const { maxCovers, narrowScope, grantedScope } = await scopes()
    for (const scope of ['all:read', 'datasets:read', 'organizations:read']) assert.ok(maxCovers(['all:read'], scope), scope)
    for (const scope of ['all:write', 'datasets:write', 'datasets', 'all', 'datasets:readAdvanced']) assert.ok(!maxCovers(['all:read'], scope), scope)
    for (const scope of ['all:read', 'all:write', 'datasets:read', 'datasets:write']) assert.ok(maxCovers(['all:write'], scope), scope)
    assert.ok(!maxCovers(['all:write'], 'webhooks:admin'))
    assert.ok(maxCovers(['all:admin'], 'webhooks:admin'))
    // a bare umbrella stays out of reach of the global tier scopes
    assert.ok(!maxCovers(['all:admin'], 'datasets'))
    assert.deepEqual(narrowScope(['datasets:read', 'datasets:write', 'all:read'], ['all:read'], []), ['datasets:read', 'all:read'])
    assert.equal(grantedScope(['all:write'], 'organizations:read datasets:write'), 'organizations:read datasets:write')
    assert.throws(() => grantedScope(['all:read'], 'datasets:write'), /exceeds/)
    // without a maximum, the known list is matched as names
    assert.deepEqual(narrowScope(['unknown:read', 'all:read'], undefined, ['all:admin', 'all:read']), ['all:read'])
  })

  test('every locale describes exactly the scope vocabulary', async () => {
    const { vocabulary } = await import('../../api/src/scopes/vocabulary.ts')
    const names = Object.keys(vocabulary.scopeDescriptions('en')).sort()
    assert.ok(names.includes('all:read'))
    for (const locale of ['fr', 'en', 'de', 'es', 'it', 'pt']) {
      const messages = (await import(`../../api/i18n/${locale}.js`)).default
      assert.deepEqual(Object.keys(messages.scopes).sort(), names, locale)
    }
  })

  test('refuseConsentUser refuses nhis, scoped sessions and org storage users', async () => {
    const { refuseConsentUser } = await consent()
    const session = (u: any, extra: Record<string, any> = {}): any => ({ user: { id: u.id, name: u.name, email: u.email, organizations: [] }, ...extra })
    const nhi = user({ nhi: { subject: 's', provider: { issuer: 'https://i.example.org' } } })
    assert.ok(refuseConsentUser(nhi, session(nhi)))
    assert.ok(refuseConsentUser(user(), session(user(), { scopes: ['organizations:read'] })))
    assert.ok(refuseConsentUser(user({ orgStorage: true }), session(user())))
    assert.ok(refuseConsentUser(user(), { user: { ...session(user()).user, os: 1 } } as any))
    // a superadmin impersonating the user (asAdmin) never consents in their name
    assert.ok(refuseConsentUser(user(), { user: { ...session(user()).user, asAdmin: { id: 'admin', name: 'Admin' } } } as any))
    assert.equal(refuseConsentUser(user(), session(user())), undefined)
  })

  test('isBroadScope', async () => {
    const { isBroadScope } = await consent()
    assert.equal(isBroadScope('datasets'), true)
    assert.equal(isBroadScope('all:read'), true)
    assert.equal(isBroadScope('datasets:read'), false)
  })

  test('userConsentAccounts lists the personal account and memberships, default first', async () => {
    const { userConsentAccounts } = await consent()
    const u = user({ organizations: [{ id: 'o1', name: 'Org 1', role: 'user' }, { id: 'o2', name: 'Org 2', role: 'admin', department: 'd1', departmentName: 'Dep 1' }] })
    assert.deepEqual(userConsentAccounts(u).map(a => [a.type, a.id, a.department]), [['user', 'u1', undefined], ['organization', 'o1', undefined], ['organization', 'o2', 'd1']])
    // on a site of o2 the owner org is the default
    const onSite = userConsentAccounts(u, { owner: { type: 'organization', id: 'o2', name: 'Org 2' } } as any)
    assert.deepEqual(onSite.map(a => [a.type, a.id]), [['organization', 'o2'], ['user', 'u1'], ['organization', 'o1']])
    // no personal account when it is ignored
    const ipa = userConsentAccounts({ ...u, ignorePersonalAccount: true })
    assert.deepEqual(ipa.map(a => a.type), ['organization', 'organization'])
  })

  test('consentAdminOrgs keeps real org admins, departments only with depAdminIsOrgAdmin', async () => {
    const { consentAdminOrgs } = await consent()
    const { default: config } = await import('../../api/src/config.ts')
    const u = user({
      isAdmin: true,
      adminMode: true,
      organizations: [
        { id: 'o1', name: 'Org 1', role: 'admin' },
        { id: 'o2', name: 'Org 2', role: 'user' },
        { id: 'o3', name: 'Org 3', role: 'admin', department: 'd1', departmentName: 'Dep 1' },
        { id: 'o1', name: 'Org 1', role: 'admin' }
      ]
    })
    const previous = config.depAdminIsOrgAdmin
    try {
      config.depAdminIsOrgAdmin = false
      assert.deepEqual(consentAdminOrgs(u), [{ type: 'organization', id: 'o1', name: 'Org 1' }])
      config.depAdminIsOrgAdmin = true
      assert.deepEqual(consentAdminOrgs(u).map(a => [a.id, a.department]), [['o1', undefined], ['o3', 'd1']])
    } finally {
      config.depAdminIsOrgAdmin = previous
    }
  })

  test('createConsentGrant refuses an mcp resource for a user and a subject that does not match the client kind', async () => {
    const { createConsentGrant } = await consent()
    // the guards run before the provider is touched
    const provider: any = {}
    const opts: any = {
      ctx: { issuer: 'https://x.org/simple-directory', siteUrl: 'https://x.org' },
      interaction: { params: { client_id: 'dcr-x', scope: 'organizations:read' } },
      subject: { type: 'nhi', id: 'nhi-1' },
      account: { type: 'organization', id: 'o1', name: 'Org 1' },
      clientKind: 'dcr',
      clientName: 'x',
      scope: ['organizations:read'],
      oidcScopes: [],
      resource: 'https://x.org/mcp-server/mcp',
      resourceKind: 'mcp',
      lifetime: 60,
      authorizedBy: { id: 'u1', name: 'User 1' }
    }
    await assert.rejects(createConsentGrant(provider, { ...opts, subject: { type: 'user', id: 'u1' } }), /an mcp resource requires an nhi subject/)
    await assert.rejects(createConsentGrant(provider, { ...opts, subject: { type: 'user', id: 'u1' }, resourceKind: 'api', resource: 'https://x.org' }), /does not match the client kind/)
    await assert.rejects(createConsentGrant(provider, { ...opts, clientKind: 'site', resourceKind: 'api', resource: 'https://x.org' }), /does not match the client kind/)
    await assert.rejects(createConsentGrant(provider, { ...opts, scope: [] }), /at least one platform scope/)
  })

  test('a failed consent decision ends the interaction', async () => {
    await initMongo()
    const { finishUserConsent } = await import('../../api/src/oauth-server/interaction.ts')
    const { issuerOfSite, mainSiteUrl } = await import('../../api/src/oauth-server/issuers.ts')
    const ctx = await issuerOfSite(undefined, mainSiteUrl())
    assert.ok(ctx)
    let saved = 0
    const provider: any = {
      Grant: class {
        addOIDCScope () {}
        rejectOIDCScope () {}
        addResourceScope () {}
        rejectResourceScope () {}
        async save () { saved++; throw new Error('boom') }
      }
    }
    const interaction: any = {
      uid: 'test_failed_' + Math.random().toString(36).slice(2),
      params: { client_id: 'site-x', scope: 'organizations:read', resource: ctx.siteUrl },
      persist: async () => {}
    }
    const decide = () => finishUserConsent({} as any, {} as any, { ctx, provider }, interaction, user(), 's1', { type: 'user', id: 'u1', name: 'User 1' }, ['organizations:read'], 'Dash')
    await assert.rejects(decide(), /boom/)
    // the decision lock stays: the interaction cannot be decided again, the person starts over
    assert.equal(await decide(), undefined)
    assert.equal(saved, 1)
  })
})
