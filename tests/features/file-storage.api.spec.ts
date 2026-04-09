import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, testEnvAx } from '../support/axios.ts'

test.describe('file storage', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Get organization list when not authenticated', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  test('Get organization list when authenticated', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    let res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.ok(res.data.count >= 7)
    res = await ax.get('/api/organizations?q=li')
    assert.equal(res.data.count, 2) // Livefish, Skilith
  })

  test('Get organization list when authenticated with api key', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations?apiKey=testkey')
    assert.equal(res.status, 200)
    assert.ok(res.data.count >= 7)
  })

  test('Get organization info as a department member', async () => {
    const ax = await axiosAuth({ email: 'dhannan8@4shared.com' })
    const res = await ax.get('/api/organizations/test_3sSi7xDIK')
    assert.equal(res.status, 200)
  })

  test('Get organization info as a member', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com' })
    const res = await ax.get('/api/organizations/test_3sSi7xDIK')
    assert.equal(res.status, 200)
  })

  test('Get organization roles', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com', org: 'test_3sSi7xDIK' })
    const res = await ax.get('/api/organizations/test_3sSi7xDIK/roles')
    assert.equal(res.status, 200)
    assert.equal(res.data.length, 2)
  })

  test('Cannot get organization roles when non member', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/test_ihMQiGTaY/roles'), (res: any) => res.status === 403)
  })

  test('Get user list when not authenticated', async () => {
    const ax = await axios()
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  test('Get user list when authenticated', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 11)
    assert.ok(res.data.results[0].id)
  })

  test('Get filtered user list', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users?q=meadus')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 1)
  })

  test('Get user list with all fields when not admin', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/users?allFields=true'), (res: any) => res.status === 403)
  })

  test('Get user list with all fields as admin', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    const res = await ax.get('/api/users?allFields=true')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 11)
    assert.ok(res.data.results[0].organizations)
  })

  test('Get user info when not authenticated', async () => {
    const ax = await axios()
    await assert.rejects(ax.get('/api/users/test_ccherryholme1'), (res: any) => res.status === 401)
  })

  test('Get user info when authenticated as another user', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/users/test_ccherryholme1'), (res: any) => res.status === 403)
  })

  test('Get user infos', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users/test_dmeadus0')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })
})
