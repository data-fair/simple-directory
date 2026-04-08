import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, clean, seed } from '../support/axios.ts'

test.describe('i18n', () => {
  test.beforeEach(async () => {
    await clean()
    await seed()
  })

  test('Error message with default lang if not specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles'), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  test('Error message with default lang if unknown specified', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } }), (res: any) => {
      return res.data.includes('Permissions insuffisantes.')
    })
  })

  test('Error message with specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } }), (res: any) => {
      return res.data.includes('Insufficient permissions.')
    })
  })

  test('Error message with another specified lang', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } }), (res: any) => {
      return res.data.includes('Permisos insuficientes.')
    })
  })
})
