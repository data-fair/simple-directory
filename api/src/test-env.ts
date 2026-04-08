import { Router } from 'express'
import mongo from '#mongo'

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

// GET /api/test-env/ping — simple health check for test readiness
router.get('/ping', (req, res) => {
  res.send('ok')
})

export default router
