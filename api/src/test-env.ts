import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import express, { Router } from 'express'
import { session } from '@data-fair/lib-express'
import mongo from '#mongo'
import { onlyDecode } from './utils/session-only-decode.ts'
import config, { jwtDurations } from '#config'
import { rotateKeys, getSignatureKeys } from './tokens/keys-manager.ts'

const router = Router()

// a stand-in for data-fair's platform scopes endpoint, controlled by the tests
let mockPlatformScopes: { scopes?: Record<string, string>, down?: boolean } = { scopes: {} }
router.put('/platform-scopes', express.json(), (req, res) => {
  mockPlatformScopes = req.body
  res.status(200).send('ok')
})
router.get('/platform-scopes', (req, res) => {
  if (mockPlatformScopes.down) return res.status(503).send()
  res.send({ scopes: mockPlatformScopes.scopes ?? {} })
})
router.post('/clear-platform-scopes-cache', async (req, res) => {
  const { clearPlatformScopesCache } = await import('./scopes/service.ts')
  clearPlatformScopesCache()
  res.status(200).send('ok')
})

// Prefixed test sub-spaces: each test suite owns the accounts whose ids start with its own
// prefix (test_<suite>_), seeded and cleaned without touching other suites nor the unprefixed accounts.
const testPrefixRegexp = /^test_[a-z0-9]+(?:_[a-z0-9]+)*_$/

type SeedUser = { id: string, email?: string, firstName?: string, lastName?: string, [key: string]: any }
type SeedOrg = { id: string, name?: string, members?: { id: string, role: string, department?: string }[], [key: string]: any }

// upsert users and organizations described like dev/resources/users.json and organizations.json:
// organizations carry their members, the memberships stored on the users are rebuilt from them.
// Only the entries accepted by the filter are written, the others are ignored.
const upsertSeed = async (users: SeedUser[], orgs: SeedOrg[], accept: (id: string) => boolean) => {
  const userOrgs: Record<string, any[]> = {}
  for (const org of orgs) {
    for (const member of org.members || []) {
      if (!userOrgs[member.id]) userOrgs[member.id] = []
      userOrgs[member.id].push({
        id: org.id,
        name: org.name,
        role: member.role,
        ...(member.department ? { department: member.department } : {})
      })
    }
  }

  let usersCount = 0
  for (const user of users) {
    if (!accept(user.id)) continue
    const doc: any = {
      _id: user.id,
      ...user,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      organizations: userOrgs[user.id] || [],
      emailConfirmed: true
    }
    delete doc.id
    await mongo.users.replaceOne({ _id: doc._id }, doc, { upsert: true })
    usersCount++
  }

  let orgsCount = 0
  for (const org of orgs) {
    if (!accept(org.id)) continue
    const doc: any = {
      _id: org.id,
      ...org,
    }
    delete doc.id
    await mongo.organizations.replaceOne({ _id: doc._id }, doc, { upsert: true })
    orgsCount++
  }
  return { users: usersCount, organizations: orgsCount }
}

// every id and email of a seed body must be one of the sub-space: returns the reason of a refusal
const checkSeedBody = (body: any, forbidden: (value: string, kind: 'id' | 'email') => boolean) => {
  if (!body || !Array.isArray(body.users) || !Array.isArray(body.organizations)) return 'users and organizations arrays are required'
  for (const user of body.users) {
    if (typeof user?.id !== 'string' || forbidden(user.id, 'id')) return `user id ${user?.id} is out of the sub-space`
    if (user.email !== undefined && (typeof user.email !== 'string' || forbidden(user.email.toLowerCase(), 'email'))) return `user email ${user.email} is out of the sub-space`
  }
  for (const org of body.organizations) {
    if (typeof org?.id !== 'string' || forbidden(org.id, 'id')) return `organization id ${org?.id} is out of the sub-space`
    for (const member of org.members || []) {
      if (typeof member?.id !== 'string' || forbidden(member.id, 'id')) return `member id ${member?.id} is out of the sub-space`
    }
  }
}

const cleanPrefixed = async (req: express.Request, res: express.Response) => {
  const prefix = req.query.prefix
  if (typeof prefix !== 'string' || !testPrefixRegexp.test(prefix)) return res.status(400).send('invalid test prefix')
  // the prefix only holds [a-z0-9_], safe to use in a regexp
  const startsWithPrefix = { $regex: '^' + prefix }
  // users created through the API get a nanoid id, they are recognized by their email
  const userFilter = { $or: [{ _id: startsWithPrefix }, { email: { $regex: '^' + prefix, $options: 'i' } }] }
  const userIds = (await mongo.users.find(userFilter, { projection: { _id: 1 } }).toArray()).map(u => u._id as string)
  const orgFilter = { $or: [{ _id: startsWithPrefix }, { 'created.id': { $in: userIds } }] }
  const orgIds = (await mongo.organizations.find(orgFilter, { projection: { _id: 1 } }).toArray()).map(o => o._id as string)
  const ownerIds = [...userIds, ...orgIds]

  await mongo.organizations.deleteMany(orgFilter)
  await mongo.users.deleteMany(userFilter)
  // what is left of the other sub-spaces must not reference the deleted organizations
  if (orgIds.length) {
    await mongo.users.updateMany({ 'organizations.id': { $in: orgIds } }, { $pull: { organizations: { id: { $in: orgIds } } } })
    await mongo.organizations.updateMany({ 'partners.id': { $in: orgIds } }, { $pull: { partners: { id: { $in: orgIds } } } })
  }
  await mongo.limits.deleteMany({ $or: [{ type: 'user', id: { $in: userIds } }, { type: 'organization', id: { $in: orgIds } }] })
  await mongo.avatars.deleteMany({ $or: [{ 'owner.type': 'user', 'owner.id': { $in: userIds } }, { 'owner.type': 'organization', 'owner.id': { $in: orgIds } }] })
  await mongo.sites.deleteMany({ $or: [{ _id: startsWithPrefix }, { 'owner.id': { $in: ownerIds } }] })
  await mongo.oauthTokens.deleteMany({ 'user.id': { $in: userIds } })
  const { getSiteByHost } = await import('./sites/service.ts')
  getSiteByHost.clear()
  res.status(204).send()
}

// DELETE /api/test-env — clean test data (DELETE /?prefix=<p> only cleans a prefixed sub-space)
// Seeded data uses test_* prefixed IDs, dynamically-created test users use @test.com emails.
// NHIs match neither pattern (their synthetic email is @nhi.<publicHost>, not @test.com)
// -- swept separately by their nhi-* id prefix so they don't linger across runs.
router.delete('/', async (req, res) => {
  if (req.query.prefix !== undefined) return cleanPrefixed(req, res)
  const testIdFilter = { _id: { $regex: /^test_/ } }
  const testEmailFilter = { email: { $regex: /@test\.com$/i } }
  const nhiIdFilter = { _id: { $regex: /^nhi-/ } }
  // also clean legacy non-prefixed seed data (from before test_ prefix migration)
  const legacyIds = ['dmeadus0', 'ccherryholme1', 'cdurning2', 'hlalonde3', 'ngernier4', 'ddecruce5', 'vdulany6', 'bhazeldean7', 'dhannan8', 'icarlens9', 'superadmin']
  const legacyOrgIds = ['KWqAGZ4mG', 'ihMQiGTaY', '3sSi7xDIK', 'uakapD5tu', 'Yty0BxuZG', 'EnTgB2UbH', 'test-ldap']
  const userFilter = { $or: [testIdFilter, testEmailFilter, nhiIdFilter, { _id: { $in: legacyIds } }] }
  // orgs created through POST /api/organizations get a nanoid id (no test_ prefix), so scope
  // them by their creator instead, otherwise they accumulate across runs and pollute other
  // suites (e.g. a name-based org search). Collect the creators before the users are deleted.
  // _superadmin is excluded even though its @test.com email matches the user cleanup: it is
  // ALSO the account operators use to seed persistent dev data (dev-fixtures), and deleting
  // its organizations here leaves other users' memberships dangling — a user whose default
  // org no longer exists is forcefully logged out by keepalive on every login.
  const testUserIds = (await mongo.users.find(userFilter, { projection: { _id: 1 } }).toArray()).map(u => u._id).filter(id => id !== '_superadmin')
  const orgFilter = { $or: [testIdFilter, { _id: { $in: legacyOrgIds } }, { 'created.id': { $in: testUserIds } }] }
  const testOrgIds = (await mongo.organizations.find(orgFilter, { projection: { _id: 1 } }).toArray()).map(o => o._id)
  await mongo.organizations.deleteMany(orgFilter)
  await mongo.users.deleteMany(userFilter)
  await mongo.limits.deleteMany({ $or: [{ type: 'user', id: { $in: testUserIds } }, { type: 'organization', id: { $in: testOrgIds } }] })
  await mongo.avatars.deleteMany({ $or: [{ 'owner.type': 'user', 'owner.id': { $in: testUserIds } }, { 'owner.type': 'organization', 'owner.id': { $in: testOrgIds } }] })
  // deliberately unscoped: sites have a unique index on host, so tests must be
  // free to claim any dev host (this is why `npm run dev-fixtures` documents its
  // site as the one fixture a test run removes)
  await mongo.sites.deleteMany({})
  await mongo.oauthTokens.deleteMany()
  // oidc-provider adapter collections (oauth-tokens and oauth-relay-states are SD as an OAuth client)
  for (const { name } of await mongo.db.listCollections({ name: { $regex: /^oauth-/ } }, { nameOnly: true }).toArray()) {
    if (name === 'oauth-tokens' || name === 'oauth-relay-states') continue
    await mongo.db.collection(name).deleteMany({})
  }
  await mongo.ldapUserSessions.deleteMany()
  await mongo.fileUserSessions.deleteMany()
  await mongo.ldapMembersOverwrite.deleteMany()
  await mongo.ldapOrganizationsOverwrite.deleteMany()
  for (const passwordList of await mongo.passwordLists.find().toArray()) {
    try {
      await mongo.db.collection('password-list-' + passwordList._id).drop()
    } catch (err: any) {
      if (err.code !== 26) throw err
    }
  }
  await mongo.passwordLists.deleteMany()
  await mongo.db.collection('sd-rate-limiter-auth').deleteMany()
  await mongo.db.collection('sd-rate-limiter-contact').deleteMany()
  // the per-recipient mail budget is the one limiter whose window outlives a
  // test run: the dev server runs with NODE_ENV=development, so it uses the
  // production default of 500 mails per recipient per DAY rather than the tiny
  // test.cjs window. Shared fixture addresses (admin@test.com, user@test.com)
  // burn that budget a few mails per run and eventually exhaust it, which
  // surfaces as an unrelated `waitForMail timeout` somewhere else entirely.
  // mails-rate-limit.api.spec.ts is unaffected: it pre-fills its own bucket
  // inside each test, with a unique recipient, after this cleanup has run.
  await mongo.db.collection('sd-rate-limiter-mail').deleteMany()
  const { getSiteByHost } = await import('./sites/service.ts')
  getSiteByHost.clear()
  // Force a fresh SAML cert mint on the next request — exercises createCert end-to-end
  // every cleanup cycle instead of letting a one-time bootstrap cert linger.
  const { resetForTests: resetSaml } = await import('./saml2/service.ts')
  await resetSaml()
  mockPlatformScopes = { scopes: {} }
  const { cimdFixtures } = await import('./oauth-server/dynamic-clients.ts')
  cimdFixtures.clear()
  await mongo.platformScopes.deleteMany({})
  const { clearPlatformScopesCache } = await import('./scopes/service.ts')
  clearPlatformScopesCache()
  res.status(204).send()
})

// POST /api/test-env/seed — seed predefined users and organizations from JSON files into mongo
// This enables tests that rely on predefined file-storage users to work against the mongo-backed dev server
router.post('/seed', express.json({ limit: '5mb' }), async (req, res) => {
  // prefixed sub-space: the entries are given in the body and must all belong to the prefix
  if (req.body?.prefix !== undefined) {
    const prefix = req.body.prefix
    if (typeof prefix !== 'string' || !testPrefixRegexp.test(prefix)) return res.status(400).send('invalid test prefix')
    const refusal = checkSeedBody(req.body, (value) => !value.startsWith(prefix))
    if (refusal) return res.status(400).send(refusal)
    return res.status(200).json(await upsertSeed(req.body.users, req.body.organizations, () => true))
  }

  const usersFile = resolve(import.meta.dirname, '../../dev/resources/users.json')
  const orgsFile = resolve(import.meta.dirname, '../../dev/resources/organizations.json')
  const users = JSON.parse(readFileSync(usersFile, 'utf-8'))
  // replace port placeholders in org configs (e.g. {LDAP_PORT})
  let orgsRaw = readFileSync(orgsFile, 'utf-8')
  for (const [key, value] of Object.entries(process.env)) {
    if (value) orgsRaw = orgsRaw.replaceAll(`{${key}}`, value)
  }
  const orgs = JSON.parse(orgsRaw)
  await upsertSeed(users, orgs, id => id.startsWith('test_'))
  res.status(200).json({ users: users.length, organizations: orgs.length })
})

// POST /api/test-env/seed-dev — seed accounts of the human dev space, same body as a prefixed seed
// without the prefix. Test accounts (test_ ids, @test.com emails) are refused: they are wiped by the cleanups.
router.post('/seed-dev', express.json({ limit: '5mb' }), async (req, res) => {
  const refusal = checkSeedBody(req.body, (value, kind) => kind === 'id' ? value.startsWith('test_') : value.endsWith('@test.com'))
  if (refusal) return res.status(400).send(refusal)
  res.status(200).json(await upsertSeed(req.body.users, req.body.organizations, () => true))
})

// POST /api/test-env/rotate-keys — force key rotation for JWKS testing
router.post('/rotate-keys', async (req, res) => {
  await rotateKeys()
  getSignatureKeys.clear()
  session.init('http://localhost:' + config.port, 'fr', onlyDecode, { scopeAware: true })
  res.status(200).send('ok')
})

// PATCH /api/test-env/config — apply temporary config overrides on the running server
// Body: JSON object with config keys to override (e.g. { "alwaysAcceptInvitation": true })
// Uses Object.defineProperty to bypass node-config immutability
router.patch('/config', express.json(), (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    Object.defineProperty(config, key, { value, writable: true, configurable: true })
  }
  res.status(200).send('ok')
})

// PATCH /api/test-env/user/:email — update arbitrary fields on a user document
router.patch('/user/:email', express.json(), async (req, res) => {
  const result = await mongo.users.updateOne({ email: req.params.email }, { $set: req.body })
  if (result.matchedCount === 0) return res.status(404).send('user not found')
  res.status(200).send('ok')
})

// POST /api/test-env/run-user-cleanup — run the user cleanup cron task once, synchronously,
// instead of waiting for its schedule
router.post('/run-user-cleanup', async (req, res) => {
  const { task } = await import('./users/worker.ts')
  await task()
  res.status(200).send('ok')
})

// POST /api/test-env/cimd-fixtures — serve a client id metadata document from memory instead of
// fetching its url (oauth-server/dynamic-clients.ts ssrfFetch)
// Body: { url: string, document: object }
router.post('/cimd-fixtures', express.json(), async (req, res) => {
  const { cimdFixtures } = await import('./oauth-server/dynamic-clients.ts')
  cimdFixtures.set(req.body.url, req.body.document)
  res.status(200).send('ok')
})

// POST /api/test-env/clear-site-cache — clear the memoized site lookups and
// the derived main-site resources
router.post('/clear-site-cache', async (req, res) => {
  const { getSiteByHost, getMainSiteDoc } = await import('./sites/service.ts')
  const { clearSiteResourceCaches } = await import('./sites/main-site.ts')
  getSiteByHost.clear()
  getMainSiteDoc.clear()
  clearSiteResourceCaches()
  res.status(200).send('ok')
})

// GET /api/test-env/config — expose relevant config values to tests
// This prevents tests from importing config.ts locally (which loads test.cjs instead of development.cjs)
router.get('/config', (req, res) => {
  res.json({
    publicUrl: config.publicUrl,
    secretKeys: config.secretKeys,
    mongo: { url: config.mongo.url },
    authRateLimit: config.authRateLimit,
    mailsRateLimit: config.mailsRateLimit,
    oauthServer: config.oauthServer,
    // already converted to seconds by config.ts, so tests can assert on token durations
    // without duplicating the ms() parsing of the raw config strings
    jwtDurations
  })
})

// GET /api/test-env/ping — simple health check for test readiness
router.get('/ping', (req, res) => {
  res.send('ok')
})

// GET /api/test-env/events — SSE stream of mail events for tests
router.get('/events', async (req, res) => {
  const { events } = await import('./mails/service.ts')
  req.socket.setNoDelay(true)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  res.flushHeaders()

  const onSend = (data: any) => {
    res.write(`event: mail\ndata: ${JSON.stringify(data)}\n\n`)
  }
  events.on('send', onSend)
  req.on('close', () => {
    events.off('send', onSend)
  })
})

// --- LDAP test helpers ---

// POST /api/test-env/ldap/users — create a user in LDAP using a given config
// Body: { config: LdapParams, user: UserWritable, extraAttrs?: Record<string, string | string[]> }
router.post('/ldap/users', express.json(), async (req, res) => {
  const ldapStorage = await import('./storages/ldap.ts')
  const storage = await ldapStorage.init(req.body.config)
  await storage._createUser(req.body.user, req.body.extraAttrs || {})
  res.status(201).send('ok')
})

// DELETE /api/test-env/ldap/users/:id — delete a user from LDAP
// Body: { config: LdapParams }
router.delete('/ldap/users/:id', express.json(), async (req, res) => {
  const ldapStorage = await import('./storages/ldap.ts')
  const storage = await ldapStorage.init(req.body.config)
  await storage._deleteUser(req.params.id)
  res.status(204).send()
})

// POST /api/test-env/ldap/organizations — create an organization in LDAP
// Body: { config: LdapParams, organization: Organization }
router.post('/ldap/organizations', express.json(), async (req, res) => {
  const ldapStorage = await import('./storages/ldap.ts')
  const storage = await ldapStorage.init(req.body.config)
  await storage._createOrganization(req.body.organization)
  res.status(201).send('ok')
})

// DELETE /api/test-env/ldap/organizations/:id — delete an organization from LDAP
// Body: { config: LdapParams }
router.delete('/ldap/organizations/:id', express.json(), async (req, res) => {
  const ldapStorage = await import('./storages/ldap.ts')
  const storage = await ldapStorage.init(req.body.config)
  await storage._deleteOrganization(req.params.id)
  res.status(204).send()
})

// POST /api/test-env/ldap/clean — clean test LDAP data (users + orgs)
// Body: { config: LdapParams, emails?: string[], orgIds?: string[] }
router.post('/ldap/clean', express.json(), async (req, res) => {
  const ldapStorage = await import('./storages/ldap.ts')
  const storage = await ldapStorage.init(req.body.config)
  for (const email of (req.body.emails || [])) {
    const user = await storage.getUserByEmail(email)
    if (user) await storage._deleteUser(user.id)
  }
  for (const id of (req.body.orgIds || [])) {
    const org = await storage.getOrganization(id)
    if (org) await storage._deleteOrganization(org.id)
  }
  storage.clearCache()
  res.status(204).send()
})

// POST /api/test-env/ldap/org-storage-users — create a user using an org's configured LDAP storage
// Body: { orgId: string, user: UserWritable, extraAttrs?: Record<string, string | string[]> }
router.post('/ldap/org-storage-users', express.json(), async (req, res) => {
  const storages = (await import('./storages/index.ts')).default
  const org = await storages.globalStorage.getOrganization(req.body.orgId)
  if (!org) return res.status(404).send('organization not found')
  const storage = await storages.createOrgStorage(org) as any
  if (!storage) return res.status(400).send('organization has no LDAP storage configured')
  await storage._createUser(req.body.user, req.body.extraAttrs || {})
  res.status(201).send('ok')
})

export default router
