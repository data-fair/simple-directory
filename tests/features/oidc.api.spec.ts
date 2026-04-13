import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, loginWithOIDC, mockOidcControlUrl1, mockOidcControlUrl2 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'

const mockOidcPort1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const mockOidcPort2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')

const oidcUserInfo1 = { sub: 'testoidc1', email: 'oidc1@test.com', given_name: 'OIDC', family_name: 'Test', role: 'contrib' }
const oidcUserInfo2 = { sub: 'testoidc2', email: 'oidc2@test.com', given_name: 'OIDC', family_name: 'Test', role: 'contrib' }

test.describe('global OIDC configuration', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', oidcUserInfo1)
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', oidcUserInfo2)
    await testEnvAx.patch('/config', { defaultOrg: 'test_org1', defaultRolesLabels: {} })
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
    await axiosBuilder().delete(mockOidcControlUrl2 + '/_test')
    await testEnvAx.patch('/config', { defaultOrg: 'admins-org', defaultRolesLabels: { admin: 'Administrateur' } })
  })

  test('should implement a standard login workflow', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find((p: any) => p.id === 'github'))
    assert.ok(providers.find((p: any) => p.id === 'localhost' + mockOidcPort1))

    const ax1 = await loginWithOIDC(mockOidcPort1)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.equal(me.readOnly, undefined)
    assert.deepEqual(me.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1 }])

    // by default the info is not synced on next login
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', { ...oidcUserInfo1, family_name: 'Test2', role: 'admin' })
    const ax2 = await loginWithOIDC(mockOidcPort1)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc1@test.com')
    assert.equal(me2.name, 'OIDC Test')
    assert.deepEqual(me2.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1 }])
  })

  test('should implement a standard login workflow on a core id provider', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find((p: any) => p.id === 'github'))
    assert.ok(providers.find((p: any) => p.id === 'localhost' + mockOidcPort1))

    const ax1 = await loginWithOIDC(mockOidcPort2)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc2@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.deepEqual(me.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1, readOnly: true }])

    // the info is synced on next login
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', { ...oidcUserInfo2, family_name: 'Test2', role: 'admin' })
    const ax2 = await loginWithOIDC(mockOidcPort2)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc2@test.com')
    assert.equal(me2.name, 'OIDC Test2')
    assert.deepEqual(me2.organizations, [{ id: 'test_org1', name: 'test', role: 'admin', dflt: 1, readOnly: true }])
  })
})
