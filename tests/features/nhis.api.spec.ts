import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import { axios, createUser, deleteAllEmails, testEnvAx } from '../support/axios.ts'

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }
const jwks = { keys: [publicJwk] }
const issuer = 'https://test-issuer.example.com'
const subject = 'system:serviceaccount:agents:my-agent'

const nhiBody = (overrides: Record<string, any> = {}) => ({
  name: 'My agent', role: 'user', subject, provider: { issuer, jwks }, ...overrides
})

test.beforeEach(async () => {
  await deleteAllEmails()
  await testEnvAx.delete('/')
})

test('org admin manages NHIs, member listing excludes them by default', async () => {
  const { ax } = await createUser('nhi-admin@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org' })).data
  ax.setOrg(org.id)

  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  assert.ok(nhi.id.startsWith('nhi-'))
  assert.equal(nhi.name, 'My agent')

  const list = (await ax.get(`/api/organizations/${org.id}/nhis`)).data
  assert.equal(list.count, 1)
  assert.equal(list.results[0].subject, subject)

  // default member listing excludes NHIs
  const members = (await ax.get(`/api/organizations/${org.id}/members`)).data
  assert.equal(members.count, 1) // only the human admin
  // explicit types include them
  const nhiMembers = (await ax.get(`/api/organizations/${org.id}/members`, { params: { types: 'nhi' } })).data
  assert.equal(nhiMembers.count, 1)
  assert.equal(nhiMembers.results[0].id, nhi.id)

  await ax.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { name: 'Renamed agent', role: 'admin' })
  const patched = (await ax.get(`/api/organizations/${org.id}/nhis`)).data.results[0]
  assert.equal(patched.name, 'Renamed agent')
  assert.equal(patched.role, 'admin')

  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`)
  assert.equal((await ax.get(`/api/organizations/${org.id}/nhis`)).data.count, 0)
})

test('non-admin members cannot manage NHIs, bad role rejected', async () => {
  const { ax } = await createUser('nhi-admin2@test.com')
  const org = (await ax.post('/api/organizations', { name: 'NHI org 2' })).data
  ax.setOrg(org.id)
  await assert.rejects(ax.post(`/api/organizations/${org.id}/nhis`, nhiBody({ role: 'nosuchrole' })), (err: any) => err.status === 400)
  const anonymous = axios()
  await assert.rejects(anonymous.post(`/api/organizations/${org.id}/nhis`, nhiBody()), (err: any) => err.status === 401 || err.status === 403)
})
