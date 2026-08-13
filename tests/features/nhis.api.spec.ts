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

  // a genuine authenticated non-admin (plain 'user' role) member is also forbidden
  const { ax: axMember } = await createUser('nhi-member2@test.com')
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })
  await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'nhi-member2@test.com', role: 'user' })
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: false })

  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody())).data
  await assert.rejects(axMember.post(`/api/organizations/${org.id}/nhis`, nhiBody({ subject: subject + '-member' })), (err: any) => err.status === 403)
  await assert.rejects(axMember.patch(`/api/organizations/${org.id}/nhis/${nhi.id}`, { name: 'renamed by member' }), (err: any) => err.status === 403)
  await assert.rejects(axMember.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`), (err: any) => err.status === 403)

  // NHIs have no email, so the test-env cleanup filter (which matches _id/^test_/ and
  // email@test.com) does not sweep them up -- delete explicitly to avoid leaking an
  // email:null user document across test runs (collides with the unique email index).
  await ax.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`)
})
