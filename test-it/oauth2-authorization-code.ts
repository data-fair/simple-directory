process.env.STORAGE_TYPE = 'mongo'
process.env.OAUTH2_SERVER_CLIENTS = JSON.stringify([{
  id: 'native-app-client',
  name: 'Native App Client',
  redirectUris: ['native-app://auth-callback']
}])

import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'

describe('OAuth2 Authorization Code Flow', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should implement Authorization Code flow for native apps', async () => {
    // 1. Create a user
    const { ax, user } = await createUser('native-test@test.com')

    // 2. Call /authorize endpoint (simulating browser request with active session)
    // The user is already logged in via `ax` (which has cookies)
    const authorizeUrl = '/api/auth/authorize?response_type=code&client_id=native-app-client&redirect_uri=native-app://auth-callback'

    const authorizeRes = await ax.get(authorizeUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    })

    // 3. Verify redirect to custom scheme with code
    const redirectUrl = new URL(authorizeRes.headers.location)
    assert.equal(redirectUrl.protocol, 'native-app:')
    assert.equal(redirectUrl.host, 'auth-callback')

    const code = redirectUrl.searchParams.get('code')
    assert.ok(code, 'Authorization code should be present')

    // 4. Exchange code for token (simulating native app request)
    // This request comes from the app, so it doesn't have the browser session cookies
    const appAx = await axios()

    const tokenRes = await appAx.post('/api/auth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: 'native-app-client'
    })

    assert.equal(tokenRes.status, 200)
    assert.ok(tokenRes.data.access_token, 'Access token should be present')
    assert.ok(tokenRes.data.id_token_ex, 'Exchange token should be present')

    // 5. Verify the access token is valid and belongs to the user
    // The access_token is a JWT in this implementation (parts 0 and 1 + sign part 2)
    const tokenParts = tokenRes.data.access_token.split('.')
    assert.equal(tokenParts.length, 3)

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    assert.equal(payload.id, user.id)
    assert.equal(payload.email, 'native-test@test.com')

    // 6. Security Check: Verify code replay prevention
    // Try to use the same code again -> should fail
    try {
      await appAx.post('/api/auth/token', {
        grant_type: 'authorization_code',
        code,
        client_id: 'native-app-client'
      })
      throw new Error('REPLAY_SUCCESS') // Throw a specific error if it succeeds
    } catch (err: any) {
      if (err.message === 'REPLAY_SUCCESS') {
        assert.fail('Security Vulnerability: Authorization code was successfully reused!')
      }
      const status = err.response?.status || err.status
      assert.equal(status, 400, `Expected 400 but got ${status} (Error: ${err.message})`)

      const data = err.response?.data || err.data || err.message
      assert.match(String(data), /Invalid or expired code/)
    }
  })

  it('should preserve state parameter for CSRF protection', async () => {
    const { ax } = await createUser('native-test-state@test.com')
    const state = 'random-csrf-token-123'

    const authorizeUrl = `/api/auth/authorize?response_type=code&client_id=native-app-client&redirect_uri=native-app://auth-callback&state=${state}`

    const authorizeRes = await ax.get(authorizeUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    })

    const redirectUrl = new URL(authorizeRes.headers.location)
    assert.equal(redirectUrl.searchParams.get('state'), state)
  })

  it('should reject invalid client_id', async () => {
    const { ax } = await createUser('native-test-2@test.com')

    const authorizeUrl = '/api/auth/authorize?response_type=code&client_id=invalid-client&redirect_uri=native-app://auth-callback'

    const authorizeRes = await ax.get(authorizeUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 400
    })

    assert.match(authorizeRes.data, /Unknown client_id/)
  })

  it('should reject invalid redirect_uri', async () => {
    const { ax } = await createUser('native-test-3@test.com')

    const authorizeUrl = '/api/auth/authorize?response_type=code&client_id=native-app-client&redirect_uri=http://evil.com/callback'

    const authorizeRes = await ax.get(authorizeUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 400
    })

    assert.match(authorizeRes.data, /Invalid redirect_uri/)
  })
})
