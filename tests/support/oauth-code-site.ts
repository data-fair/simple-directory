// The issuer site of the authorization code flow tests: an org's account main site with one site
// client, and a user of that site who is a member of the owner org.
import { MongoClient } from 'mongodb'
import { axios, createUser, testEnvAx, getServerConfig } from './axios.ts'
import type { CodeFlowOptions } from './oauth-client.ts'

export const siteHost = `127.0.0.1:${process.env.NGINX_PORT2}`
export const siteUrl = `http://${siteHost}`
export const issuer = siteUrl + '/simple-directory'
export const siteId = 'test_oauth_code_site'
export const realmHost = `127.0.0.1:${process.env.NGINX_PORT3}`
export const realmUrl = `http://${realmHost}`
export const redirectUri = 'http://localhost:5999/cb'
export const password = 'TestPasswd01'

export const clientBody = (extra: Record<string, any> = {}) => ({
  name: 'Dash',
  redirectUris: [redirectUri],
  scopes: ['organizations:read'],
  consent: 'explicit',
  ...extra
})

export const withMongo = async <T>(fn: (db: ReturnType<MongoClient['db']>) => Promise<T>) => {
  const config = await getServerConfig()
  const mongoClient = await MongoClient.connect(config.mongo.url)
  try {
    return await fn(mongoClient.db())
  } finally {
    await mongoClient.close()
  }
}

export const grantRecords = (filter: Record<string, any>) => withMongo(db => db.collection<any>('oauth-grants').find(filter).toArray())

export const setup = async (client: Record<string, any> = {}) => {
  const config = await getServerConfig()
  const { ax: ownerAx } = await createUser('oauth-code-owner@test.com')
  const org = (await ownerAx.post('/api/organizations', { name: 'OAuth code org' })).data
  const owner = { type: 'organization', id: org.id, name: org.name }
  await axios().post('/api/sites', { _id: siteId, owner, host: siteHost }, { params: { key: config.secretKeys.sites } })
  const { ax: adminAx } = await createUser('admin@test.com', true)
  await adminAx.patch('/api/sites/' + siteId, { isAccountMain: true, oauthClients: [clientBody(client)] })
  await testEnvAx.post('/clear-site-cache')
  const clientId: string = (await adminAx.get('/api/sites/' + siteId, { params: { showAll: true } })).data.oauthClients[0].id
  const { ax: userAx, user } = await createUser('oauth-code-user@test.com', false, password, issuer)
  await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, role: 'user' }] })
  const flow = (extra: Partial<CodeFlowOptions> = {}): CodeFlowOptions => ({
    issuer, clientId, redirectUri, scope: 'organizations:read', browserAx: userAx, ...extra
  })
  return { config, org, owner, ownerAx, adminAx, clientId, userAx, user, flow }
}

export const patchClient = async (adminAx: any, clientId: string, extra: Record<string, any>) => {
  await adminAx.patch('/api/sites/' + siteId, { oauthClients: [{ ...clientBody(), id: clientId, ...extra }] })
  await testEnvAx.post('/clear-site-cache')
}
