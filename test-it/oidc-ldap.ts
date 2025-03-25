import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer, loginWithOIDC } from './utils/index.ts'
import { OAuth2Server } from 'oauth2-mock-server'

process.env.STORAGE_TYPE = 'ldap'
process.env.OIDC_PROVIDERS = JSON.stringify([{
  title: 'Test provider',
  discovery: 'http://localhost:8998/.well-known/openid-configuration',
  client: {
    id: 'test-client',
    secret: 'test-secret'
  }
}])
process.env.DEFAULT_ORG = 'myorg'
process.env.NODE_CONFIG_DIR = './api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))

const oidcUserInfo1 = { sub: 'testoidc1', email: 'oidc1@test.com' }

const startOAuthServer = async (port: number, oidcUserInfo: any) => {
  const oauthServer = new OAuth2Server()
  await oauthServer.issuer.keys.generate('RS256')
  oauthServer.service.on('beforeUserinfo', (userInfoResponse, req) => {
    userInfoResponse.body = { ...oidcUserInfo }
  })
  await oauthServer.start(port, 'localhost')
  return oauthServer
}

describe('global OIDC configuration backed with ldap storage', () => {
  let oauthServer1: OAuth2Server
  before(async () => {
    oauthServer1 = await startOAuthServer(8998, oidcUserInfo1)
  })
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))
  // prepare ldap directory
  beforeEach(async () => {
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)
    await storage._createOrganization({ id: 'myorg', name: 'My Org' })
    await storage._createUser({
      id: 'oidc1',
      firstName: 'Test',
      lastName: 'Oidc',
      email: 'oidc1@test.com',
      organizations: [{ id: 'myorg', role: 'user', name: 'my org' }],
      password: 'TestPasswd01'
    })
  })
  after(stopApiServer)
  after(async () => {
    await oauthServer1.stop()
  })

  it('should implement a standard login workflow', async () => {
    const ax1 = await loginWithOIDC(8998)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc1@test.com')
    await ax1.post('/api/auth/keepalive')
  })
})
