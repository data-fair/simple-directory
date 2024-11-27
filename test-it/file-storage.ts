import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

describe('file storage', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('Get organization list when not authenticated', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  it('Get organization list when authenticated', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    let res = await ax.get('/api/organizations')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 7)
    res = await ax.get('/api/organizations?q=li')
    assert.equal(res.data.count, 2)
  })

  it('Get organization list when authenticated with api key', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations?apiKey=testkey')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 7)
  })

  it('Get organization roles', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com', org: '3sSi7xDIK' })
    const res = await ax.get('/api/organizations/3sSi7xDIK/roles')
    assert.equal(res.status, 200)
    assert.equal(res.data.length, 2)
  })

  it('Cannot get organization roles when non member', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles'), (res: any) => res.status === 403)
  })

  it('Find users from storage', async () => {
    const storage = (await import('../api/src/storages/index.ts')).default.globalStorage
    let res = await storage.findUsers({ skip: 0, size: 10 })
    assert.equal(res.count, 12)
    assert.ok(res.results[0].id)
    assert.ok(res.results[0].email)
    res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(res.count, 1)
  })

  it('Find members from storage', async () => {
    const storage = (await import('../api/src/storages/index.ts')).default.globalStorage
    const res = await storage.findMembers('KWqAGZ4mG', { skip: 0, size: 10 })
    assert.equal(res.count, 2)
  })

  it('Get user from storage', async () => {
    const storage = (await import('../api/src/storages/index.ts')).default.globalStorage
    const res = await storage.getUser('dmeadus0')
    assert.ok(res)
    assert.ok(res.email)
    assert.ok(res.organizations)
    assert.equal(res.organizations.length, 3)
    assert.equal(res.organizations[0].name, 'Fivechat')
    assert.equal(res.organizations[0].role, 'admin')
  })

  it('Get user list when not authenticated', async () => {
    const ax = await axios()
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 0)
  })

  it('Get user list when authenticated', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 12)
    assert.deepEqual(Object.keys(res.data.results[0]), ['id', 'name'])
  })

  it('Get filtered user list', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users?q=Al')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 3)
  })

  it('Get user list with all fields when not admin', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/users?allFields=true'), (res: any) => res.status === 403)
  })

  it('Get user list with all fields as admin', async () => {
    const ax = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    const res = await ax.get('/api/users?allFields=true')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 12)
    assert.ok(res.data.results[0].organizations)
  })

  it('Get user info when not authenticated', async () => {
    const ax = await axios()
    await assert.rejects(ax.get('/api/users/ccherryholme1'), (res: any) => res.status === 401)
  })

  it('Get user info when authenticated as another user', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/users/ccherryholme1'), (res: any) => res.status === 403)
  })

  it('Get user infos', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const res = await ax.get('/api/users/dmeadus0')
    assert.equal(res.status, 200)
    assert.equal(res.data.email, 'dmeadus0@answers.com')
  })
})
