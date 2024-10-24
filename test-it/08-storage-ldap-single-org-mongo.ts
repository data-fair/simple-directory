import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'

process.env.STORAGE_TYPE = 'mongo'
process.env.NODE_CONFIG_DIR = 'api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
ldapConfig.organizations.staticSingleOrg = { id: 'test-single-org', name: 'Test single org' }
ldapConfig.members.role.values = { admin: ['administrator'], user: [] }

describe.only('ldap storage per organization in mongodb storage mode', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))
  after(stopApiServer)

  it.only('create a user and organization and configure orgStorage with ldap config', async () => {
    const { ax, user } = await createUser('test1@test.com')
    console.log('USER', user)
  })
})
