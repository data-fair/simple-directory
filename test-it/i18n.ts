import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

describe('i18n', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('Error message with default lang if not specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles'), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  it('Error message with default lang if unknown specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } }), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  it('Error message with specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } }), (res: any) => {
      return res.data.includes('Insufficient permissions.')
    })
  })

  it('Error message with another specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } }), (res: any) => {
      return res.data.includes('Permisos insuficientes.')
    })
  })
})
