import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios } from '../support/axios.ts'

test.describe('api docs', () => {
  test('api docs declare the oauth token url', async () => {
    const res = await axios().get('/api/api-docs.json')
    assert.equal(res.data.components.securitySchemes.oauth2.flows.clientCredentials.tokenUrl, '/simple-directory/api/oauth/token')
    assert.equal(res.data.paths['/api/auth/nhi-token'].post.deprecated, true)
  })
})
