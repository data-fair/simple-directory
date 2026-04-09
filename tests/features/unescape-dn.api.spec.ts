import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { mock } from 'node:test'
import { testEnvAx } from '../support/axios.ts'
import { initMongo, closeMongo } from '../support/unit.ts'
import { unescapeNonAsciiInDn } from '../../api/src/utils/dn.ts'
import ldap from 'ldapjs'

let ldapConfig: any

test.describe('unescapeNonAsciiInDn', () => {
  test('decodes 2-byte UTF-8 (e)', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Ren\\c3\\a9,OU=Users'),
      'CN=Ren\u00e9,OU=Users'
    )
  })

  test('re-escapes DN-special chars after decoding', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Doe\\2c John,OU=Users'),
      'CN=Doe\\, John,OU=Users'
    )
  })

  test('handles mixed accented char + escaped comma', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Ren\\c3\\a9\\2c Jean,OU=Utilisateurs,OU=DSTI'),
      'CN=Ren\u00e9\\, Jean,OU=Utilisateurs,OU=DSTI'
    )
  })

  test('leaves plain ASCII DNs unchanged', () => {
    const dn = 'CN=John Doe,OU=Users,DC=example,DC=com'
    assert.equal(unescapeNonAsciiInDn(dn), dn)
  })
})

test.describe('LDAP checkPassword sends unescaped DN to bind', () => {
  let storage: Awaited<ReturnType<typeof import('../../api/src/storages/ldap.ts').init>>

  async function cleanTestData () {
    for (const id of ['Ren\u00e9 Dupont']) {
      try { await storage._deleteUser(id) } catch (_e) { /* ignore */ }
    }
    try { await storage._deleteOrganization('TestOrg') } catch (_e) { /* ignore */ }
  }

  test.beforeAll(async () => {
    await initMongo()
    const config = (await import('../../api/src/config.ts')).default
    ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    storage = await ldapStorage.init(ldapConfig)
    await cleanTestData()
  })

  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await cleanTestData()
  })

  test.afterAll(async () => {
    await cleanTestData()
    await closeMongo()
  })

  test('bind DN contains raw e, not hex-escaped \\c3\\a9', async () => {
    await storage._createOrganization({ id: 'TestOrg', name: 'Test Org' })
    await storage._createUser({
      id: 'Ren\u00e9 Dupont',
      firstName: 'Ren\u00e9',
      lastName: 'Dupont',
      email: 'rene.dupont@test.com',
      password: 'Test1234!',
      organizations: [{ id: 'TestOrg', role: 'user', name: 'Test Org' }]
    })

    // spy on ldap.createClient to capture the DN passed to bind()
    let bindDn: string | undefined
    const origCreateClient = ldap.createClient.bind(ldap)
    mock.method(ldap, 'createClient', (...args: Parameters<typeof ldap.createClient>) => {
      const client = origCreateClient(...args)
      const origBind = client.bind.bind(client)
      client.bind = (dn: any, ...rest: any[]) => {
        bindDn = typeof dn === 'string' ? dn : dn.toString()
        return (origBind as any)(dn, ...rest)
      }
      return client
    })

    try {
      const result = await storage.checkPassword('Ren\u00e9 Dupont', 'Test1234!')
      assert.equal(result, true)

      // the DN actually passed to client.bind() must contain the real e
      // without the fix, ldapjs DN.toString() would send \c3\a9 which
      // Active Directory cannot resolve -> InvalidCredentialsError
      assert.ok(bindDn, 'bind should have been called')
      assert.ok(bindDn!.includes('\u00e9'), `bind DN should contain raw \u00e9, got: ${bindDn}`)
      assert.ok(!bindDn!.includes('\\c3\\a9'), `bind DN should NOT contain hex-escaped \\c3\\a9, got: ${bindDn}`)
    } finally {
      mock.restoreAll()
    }
  })
})
