import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

describe('i18n', () => {
  before(startApiServer)
  beforeEach(clean)
  after(stopApiServer)

  it('Error message with default lang if not specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles'), (res: any) => {
      assert.equal(res.data, 'Permissions insuffisantes.')
      return true
    })
  })

  it('Error message with default lang if unknown specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } }), (res: any) => {
      assert.equal(res.data, 'Permissions insuffisantes.')
      return true
    })
  })

  it('Error message with specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } }), (res: any) => {
      assert.equal(res.data, 'Insufficient permissions.')
      return true
    })
  })

  it('Error message with another specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } }), (res: any) => {
      assert.equal(res.data, 'Permisos insuficientes.')
      return true
    })
  })
})
