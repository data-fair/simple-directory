const assert = require('assert').strict
const testUtils = require('./resources/test-utils')

describe('i18n', () => {
  it('Error message with default lang if not specified', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/ihMQiGTaY/roles')
    assert.equal(res.data, 'Permissions insuffisantes.')
  })

  it('Error message with default lang if unknown specified', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } })
    assert.equal(res.data, 'Permissions insuffisantes.')
  })

  it('Error message with specified lang', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } })
    assert.equal(res.data, 'Insufficient permissions.')
  })

  it('Error message with another specified lang', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    const res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } })
    assert.equal(res.data, 'Permisos insuficientes.')
  })
})
