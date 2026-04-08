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
  res.status(204).send()
})

// POST /api/test-env/seed — seed predefined users and organizations from JSON files into mongo
// This enables tests that rely on predefined file-storage users to work against the mongo-backed dev server
router.post('/seed', async (req, res) => {
  const usersFile = resolve(import.meta.dirname, '../../dev/resources/users.json')
  const orgsFile = resolve(import.meta.dirname, '../../dev/resources/organizations.json')
  const users = JSON.parse(readFileSync(usersFile, 'utf-8'))
  const orgs = JSON.parse(readFileSync(orgsFile, 'utf-8'))

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

// GET /api/test-env/ping — simple health check for test readiness
router.get('/ping', (req, res) => {
  res.send('ok')
})

export default router
