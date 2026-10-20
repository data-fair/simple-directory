import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios } from '../support/axios.ts'

test.describe('api docs', () => {
  test('api docs declare the oauth token url', async () => {
    const res = await axios().get('/api/api-docs.json')
    assert.equal(res.data.components.securitySchemes.oauth2.flows.clientCredentials.tokenUrl, '/simple-directory/api/oauth/token')
    assert.equal(res.data.paths['/api/auth/nhi-token'].post.deprecated, true)
  })

  test('api docs declare the oauth authorization code flow', async () => {
    const res = await axios().get('/api/api-docs.json')
    const flows = res.data.components.securitySchemes.oauth2.flows
    assert.equal(flows.authorizationCode.authorizationUrl, '/simple-directory/api/oauth/authorize')
    assert.equal(flows.authorizationCode.tokenUrl, '/simple-directory/api/oauth/token')
    assert.equal(flows.authorizationCode.refreshUrl, '/simple-directory/api/oauth/token')
    assert.deepEqual(flows.authorizationCode.scopes, flows.clientCredentials.scopes)
  })
})
