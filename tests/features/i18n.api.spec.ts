import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, createUser, testEnvAx } from '../support/axios.ts'

test.describe('i18n', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Error message with default lang if not specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/test_sd_ihMQiGTaY/roles'), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  test('Error message with default lang if unknown specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/test_sd_ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } }), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  test('Error message with specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/test_sd_ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } }), (res: any) => {
      return res.data.includes('Insufficient permissions.')
    })
  })

  test('Error message with another specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/test_sd_ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } }), (res: any) => {
      return res.data.includes('Permisos insuficientes.')
    })
  })

  // the storage throws an I18nHttpError, without the request at hand: i18nErrorMiddleware translates it
  test('Error thrown by a storage in the language of the request', async () => {
    await testEnvAx.patch('/config', { multiRoles: false })
    const { ax, user } = await createUser('test-i18n-storage@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test', departments: [{ id: 'dep1', name: 'Department 1' }] })).data
    ax.setOrg(org.id)
    const patchToUnknownDepartment = (headers: Record<string, string> = {}) =>
      ax.patch(`/api/organizations/${org.id}/members/${user.id}`, { role: 'admin', department: 'unknown' }, { headers })
    for (const [headers, message] of [
      [{}, 'Département inconnu.'],
      [{ 'Accept-Language': 'en-US' }, 'Unknown department.'],
      [{ 'Accept-Language': 'de-DE' }, 'Unbekannte Abteilung.']
    ] as const) {
      await assert.rejects(patchToUnknownDepartment(headers), (res: any) => {
        assert.equal(res.status, 404)
        assert.ok(res.data.includes(message), res.data)
        return true
      })
    }
  })
})
