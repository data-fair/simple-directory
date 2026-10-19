import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, createUser, deleteAllEmails, testEnvAx, devApiUrl } from '../support/axios.ts'

const platformScopesUrl = `${devApiUrl}/api/test-env/platform-scopes`

test.beforeEach(async () => {
  await deleteAllEmails()
  await testEnvAx.delete('/')
})

test.afterAll(async () => {
  await testEnvAx.patch('/config', { platformScopesUrl: '' })
})

test('without a platform scopes url, only the simple-directory scopes are listed', async () => {
  await testEnvAx.patch('/config', { platformScopesUrl: '' })
  const { ax } = await createUser('scopes-list1@test.com')
  const scopes = (await ax.get('/api/scopes')).data.scopes
  assert.deepEqual(Object.keys(scopes).sort(), ['organizations', 'organizations:read'])
  assert.ok(scopes['organizations:read'].length > 0)
})

test('the platform scopes are merged with the simple-directory scopes', async () => {
  await testEnvAx.patch('/config', { platformScopesUrl })
  await testEnvAx.put('/platform-scopes', { scopes: { datasets: 'All dataset scopes', 'datasets:read': 'Read datasets', 'Bad name': 'ignored' } })
  const { ax } = await createUser('scopes-list2@test.com')
  const scopes = (await ax.get('/api/scopes')).data.scopes
  assert.deepEqual(Object.keys(scopes).sort(), ['datasets', 'datasets:read', 'organizations', 'organizations:read'])
  assert.equal(scopes['datasets:read'], 'Read datasets')
})

test('the last platform scopes received survive an outage', async () => {
  await testEnvAx.patch('/config', { platformScopesUrl })
  await testEnvAx.put('/platform-scopes', { scopes: { 'datasets:read': 'Read datasets' } })
  const { ax } = await createUser('scopes-list3@test.com')
  assert.ok((await ax.get('/api/scopes')).data.scopes['datasets:read'])
  // the endpoint goes down and the memory cache is dropped: the copy stored in mongo answers
  await testEnvAx.put('/platform-scopes', { down: true })
  await testEnvAx.post('/clear-platform-scopes-cache')
  assert.ok((await ax.get('/api/scopes')).data.scopes['datasets:read'])
})

test('platform scope descriptions are truncated to 500 characters', async () => {
  await testEnvAx.patch('/config', { platformScopesUrl })
  await testEnvAx.put('/platform-scopes', { scopes: { 'datasets:read': 'x'.repeat(600) } })
  const { ax } = await createUser('scopes-list4@test.com')
  const scopes = (await ax.get('/api/scopes')).data.scopes
  assert.equal(scopes['datasets:read'].length, 500)
})

test('the scope list requires a session', async () => {
  await assert.rejects(axios().get('/api/scopes'), (err: any) => err.status === 401)
})
