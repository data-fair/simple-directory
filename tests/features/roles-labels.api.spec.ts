import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, createUser, testEnvAx } from '../support/axios.ts'

test.describe('roles labels', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('the session token carries the label overridden by the organization', async () => {
    const { ax } = await createUser('user@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Org' })).data
    ax.setOrg(org.id)
    await ax.patch(`/api/organizations/${org.id}`, { rolesLabels: { admin: 'Gestionnaire' } })

    // a fresh login reads the user from the storage and rebuilds the token
    const ax2 = await axiosAuth({ email: 'user@test.com', password: 'TestPasswd01' })
    const me = (await ax2.get('/api/auth/me')).data
    assert.equal(me.organizations[0].id, org.id)
    assert.equal(me.organizations[0].roleLabel, 'Gestionnaire')
  })
})
