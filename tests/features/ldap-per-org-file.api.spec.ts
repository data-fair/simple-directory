import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, testEnvAx } from '../support/axios.ts'
import config from '../../api/src/config.ts'

const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
ldapConfig.organizations.staticSingleOrg = { id: 'test_sd_ldap', name: 'Test single org' }

const ldapEmails = ['ldap-user1@example.org', 'ldap-user2@example.org']

// see test/resources/organizations.json to see that the org "test_sd_ldap" has a specific configuration

test.describe('ldap storage per organization in file storage mode', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
    await testEnvAx.post('/ldap/clean', { config: ldapConfig, emails: ldapEmails, orgIds: [] })
  })

  // prepare ldap directory
  test.beforeEach(async () => {
    await testEnvAx.post('/ldap/users', {
      config: ldapConfig,
      user: {
        id: 'lena',
        firstName: 'Lena',
        lastName: 'Ldapuser',
        email: 'ldap-user1@example.org',
        organizations: []
      },
      extraAttrs: { employeeType: 'administrator', departmentNumber: '/prefix/2/dep1' }
    })
    await testEnvAx.post('/ldap/users', {
      config: ldapConfig,
      user: {
        id: 'lena2',
        firstName: 'Lena',
        lastName: '',
        email: 'ldap-user2@example.org',
        organizations: []
      }
    })
  })

  test('find org members from secondary ldap storage', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com', org: 'test_sd_ldap' })
    let res = await ax.get('/api/organizations/test_sd_ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)
    assert.ok(!res.data.orgStorage.config)
    const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    res = await adminAx.get('/api/organizations/test_sd_ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)

    res = await ax.get('/api/organizations/test_sd_ldap/members', { params: { org_storage: true } })
    assert.equal(res.status, 200)
    // 1 of the registered was rejected by the extraFilters param
    const member = res.data.results[0]
    assert.equal(res.data.count, 1)
    assert.equal(member.email, 'ldap-user1@example.org')
    assert.equal(member.orgStorage, true)
    assert.equal(member.id, 'ldap_test_sd_ldap_lena')
    assert.equal(member.role, 'admin')
    assert.equal(member.department, 'dep1')

    // TODO: add auth test with user password
  })
})
