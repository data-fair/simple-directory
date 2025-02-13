import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

process.env.STORAGE_TYPE = 'mongo'

describe('users api', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should login using admins credentials', async () => {
    const ax = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    let me = (await ax.get('/api/auth/me')).data
    assert.equal(me.name, 'Super Admin')
    assert.equal(me.adminMode, 1)

    await ax.post('/api/auth/keepalive')

    me = (await ax.get('/api/auth/me')).data
    assert.equal(me.name, 'Super Admin')
    assert.equal(me.adminMode, 1)
  })
})
