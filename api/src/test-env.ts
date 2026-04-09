import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Router } from 'express'
import { session } from '@data-fair/lib-express'
import mongo from '#mongo'
import config from '#config'
import { rotateKeys, getSignatureKeys } from './tokens/keys-manager.ts'

const router = Router()

// DELETE /api/test-env — clean all test data
router.delete('/', async (req, res) => {
  await mongo.organizations.deleteMany({ _id: { $ne: 'admins-org' } })
  await mongo.users.deleteMany({})
  await mongo.sites.deleteMany({})
  await mongo.oauthTokens.deleteMany()
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
  const { getSiteByHost } = await import('./sites/service.ts')
  getSiteByHost.clear()
  res.status(204).send()
})

// POST /api/test-env/seed — seed predefined users and organizations from JSON files into mongo
// This enables tests that rely on predefined file-storage users to work against the mongo-backed dev server
router.post('/seed', async (req, res) => {
  const usersFile = resolve(import.meta.dirname, '../../dev/resources/users.json')
  const orgsFile = resolve(import.meta.dirname, '../../dev/resources/organizations.json')
  const users = JSON.parse(readFileSync(usersFile, 'utf-8'))
  // replace port placeholders in org configs (e.g. {LDAP_PORT})
  let orgsRaw = readFileSync(orgsFile, 'utf-8')
  for (const [key, value] of Object.entries(process.env)) {
    if (value) orgsRaw = orgsRaw.replaceAll(`{${key}}`, value)
  }
  const orgs = JSON.parse(orgsRaw)

  // build org membership map for users
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

  for (const user of users) {
    const doc = {
      _id: user.id,
      ...user,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      organizations: userOrgs[user.id] || [],
      emailConfirmed: true
    }
    delete doc.id
    await mongo.users.replaceOne({ _id: doc._id }, doc, { upsert: true })
  }

  for (const org of orgs) {
    const doc = {
      _id: org.id,
      ...org,
    }
    delete doc.id
    await mongo.organizations.replaceOne({ _id: doc._id }, doc, { upsert: true })
  }

  res.status(200).json({ users: users.length, organizations: orgs.length })
})

// POST /api/test-env/rotate-keys — force key rotation for JWKS testing
router.post('/rotate-keys', async (req, res) => {
  await rotateKeys()
  getSignatureKeys.clear()
  session.init('http://localhost:' + config.port)
  res.status(200).send('ok')
})

// PATCH /api/test-env/config — apply temporary config overrides on the running server
// Body: JSON object with config keys to override (e.g. { "alwaysAcceptInvitation": true })
// Uses Object.defineProperty to bypass node-config immutability
import express from 'express'
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

// POST /api/test-env/clear-site-cache — clear the getSiteByHost memoized cache
router.post('/clear-site-cache', async (req, res) => {
  const { getSiteByHost } = await import('./sites/service.ts')
  getSiteByHost.clear()
  res.status(200).send('ok')
})

// GET /api/test-env/config — expose relevant config values to tests
// This prevents tests from importing config.ts locally (which loads test.cjs instead of development.cjs)
router.get('/config', (req, res) => {
  res.json({
    publicUrl: config.publicUrl,
    secretKeys: config.secretKeys
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
