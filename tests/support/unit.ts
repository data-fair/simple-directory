// Lightweight setup for unit tests that need MongoDB + LDAP but not the full Express server

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

let initialized = false

export const initMongo = async () => {
  if (initialized) return
  const mongo = (await import('../../api/src/mongo.ts')).default
  await mongo.init()
  initialized = true
}

export const closeMongo = async () => {
  if (!initialized) return
  const mongo = (await import('../../api/src/mongo.ts')).default
  await mongo.client.close()
  initialized = false
}

export const clean = async (options?: { ldapConfig?: any }) => {
  const mongo = (await import('../../api/src/mongo.ts')).default
  const testIdFilter = { _id: { $regex: /^test_/ } }
  const testEmailFilter = { email: { $regex: /@test\.com$/i } }
  await mongo.organizations.deleteMany(testIdFilter)
  await mongo.users.deleteMany({ $or: [testIdFilter, testEmailFilter] })
  await mongo.sites.deleteMany(testIdFilter)
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

  if (options?.ldapConfig) {
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    // Use a clean config without overwrites to see real LDAP entries
    const cleanConfig = JSON.parse(JSON.stringify(options.ldapConfig))
    delete cleanConfig.members?.overwrite
    delete cleanConfig.users?.overwrite
    delete cleanConfig.organizations?.overwrite
    const storage = await ldapStorage.init(cleanConfig)

    // Delete all users found in LDAP
    const allUsers = await storage.findUsers({ skip: 0, size: 1000 })
    for (const user of allUsers.results) {
      try { await storage._deleteUser(user.id) } catch (_e) { /* ignore */ }
    }
    // Delete all organizations found in LDAP (must delete users first)
    const allOrgs = await storage.findOrganizations({ skip: 0, size: 1000 })
    for (const org of allOrgs.results) {
      try { await storage._deleteOrganization(org.id) } catch (_e) { /* ignore */ }
    }

    storage.clearCache()
  }
}
