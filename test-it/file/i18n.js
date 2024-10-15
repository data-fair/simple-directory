const assert = require('assert').strict
const testUtils = require('../utils')

describe('i18n', () => {
  it('Error message with default lang if not specified', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles'), (res) => {
      assert.equal(res.data, 'Permissions insuffisantes.')
      return true
    })
  })

  it('Error message with default lang if unknown specified', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } }), (res) => {
      assert.equal(res.data, 'Permissions insuffisantes.')
      return true
    })
  })

  it('Error message with specified lang', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } }), (res) => {
      assert.equal(res.data, 'Insufficient permissions.')
      return true
    })
  })

  it('Error message with another specified lang', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    await assert.rejects(ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } }), (res) => {
      assert.equal(res.data, 'Permisos insuficientes.')
      return true
    })
  })
})
