import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { mock } from 'node:test'
import { clean, startApiServer, stopApiServer } from './utils/index.ts'
import { unescapeNonAsciiInDn } from '../api/src/utils/dn.ts'
import ldap from 'ldapjs'

process.env.NODE_CONFIG_DIR = './api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))

describe('unescapeNonAsciiInDn', () => {
  it('decodes 2-byte UTF-8 (é)', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Ren\\c3\\a9,OU=Users'),
      'CN=René,OU=Users'
    )
  })

  it('re-escapes DN-special chars after decoding', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Doe\\2c John,OU=Users'),
      'CN=Doe\\, John,OU=Users'
    )
  })

  it('handles mixed accented char + escaped comma', () => {
    assert.equal(
      unescapeNonAsciiInDn('CN=Ren\\c3\\a9\\2c Jean,OU=Utilisateurs,OU=DSTI'),
      'CN=René\\, Jean,OU=Utilisateurs,OU=DSTI'
    )
  })

  it('leaves plain ASCII DNs unchanged', () => {
    const dn = 'CN=John Doe,OU=Users,DC=example,DC=com'
    assert.equal(unescapeNonAsciiInDn(dn), dn)
  })
})

describe('LDAP checkPassword sends unescaped DN to bind', () => {
  let storage: Awaited<ReturnType<typeof import('../api/src/storages/ldap.ts').init>>

  async function cleanTestData () {
    for (const id of ['René Dupont']) {
      try { await storage._deleteUser(id) } catch (_e) { /* ignore */ }
    }
    try { await storage._deleteOrganization('TestOrg') } catch (_e) { /* ignore */ }
  }

  before(async () => {
    await startApiServer()
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    storage = await ldapStorage.init(ldapConfig)
    await cleanTestData()
  })

  beforeEach(async () => {
    await clean({ ldapConfig })
    await cleanTestData()
  })

  after(async () => {
    await cleanTestData()
    await stopApiServer()
  })

  it('bind DN contains raw é, not hex-escaped \\c3\\a9', async () => {
    await storage._createOrganization({ id: 'TestOrg', name: 'Test Org' })
    await storage._createUser({
      id: 'René Dupont',
      firstName: 'René',
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
        return origBind(dn, ...rest)
      }
      return client
    })

    try {
      const result = await storage.checkPassword('René Dupont', 'Test1234!')
      assert.equal(result, true)

      // the DN actually passed to client.bind() must contain the real é
      // without the fix, ldapjs DN.toString() would send \c3\a9 which
      // Active Directory cannot resolve → InvalidCredentialsError
      assert.ok(bindDn, 'bind should have been called')
      assert.ok(bindDn!.includes('é'), `bind DN should contain raw é, got: ${bindDn}`)
      assert.ok(!bindDn!.includes('\\c3\\a9'), `bind DN should NOT contain hex-escaped \\c3\\a9, got: ${bindDn}`)
    } finally {
      mock.restoreAll()
    }
  })
})
