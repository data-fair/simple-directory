import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'
import type { LdapStorage } from '../api/src/storages/ldap.ts'

process.env.STORAGE_TYPE = 'mongo'
process.env.NODE_CONFIG_DIR = 'api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))

const orgLdapConfig = {
  url: 'ldap://localhost:389',
  baseDN: 'dc=example,dc=org',
  searchUserDN: 'cn=admin,dc=example,dc=org',
  searchUserPassword: 'admin',
  users: {
    objectClass: 'inetOrgPerson',
    dnKey: 'cn',
    mapping: {
      id: 'cn',
      name: 'cn',
      email: 'mail',
      firstName: 'givenName',
      lastName: 'sn'
    },
    extraFilters: ['sn=Mouton']
  }
}

describe('ldap storage per organization in mongodb storage mode', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))
  after(stopApiServer)

  it('create a user and organization and configure orgStorage with ldap config', async () => {
    const { ax: axAdmin, user } = await createUser('admin@test.com', true)
    assert.ok(user.id)
    const org = (await axAdmin.post('/api/organizations', { name: 'Org 1' })).data
    assert.ok(org.id)
    const patchedOrg = (await axAdmin.patch(`/api/organizations/${org.id}`, {
      orgStorage: {
        type: 'ldap',
        active: true,
        config: orgLdapConfig
      }
    })).data

    const storage = (await (await import('../api/src/storages/index.ts')).default.createOrgStorage(patchedOrg)) as LdapStorage
    await storage._createUser({
      id: 'alban',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: org.id, role: 'user', name: 'Org 1' }],
      password: 'TestPasswd01'
    })

    const ax = await axiosAuth({ email: 'alban.mouton@koumoul.com', org: org.id, orgStorage: true })
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.ok(res.data.id.endsWith('_alban'))
    assert.equal(res.data.organizations?.[0].id, org.id)
  })
})
