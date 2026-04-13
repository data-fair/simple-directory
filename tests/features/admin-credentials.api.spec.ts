import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, testEnvAx } from '../support/axios.ts'

test.describe('admin credentials', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('should login using admins credentials', async () => {
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
