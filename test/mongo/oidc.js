const assert = require('assert').strict
const testUtils = require('../utils')

describe('OIDC', () => {
  it('should implement a standard login workflow', async () => {
    const anonymousAx = await testUtils.axios()
    const login = await anonymousAx.get('/api/auth/oauth/localhost9009/login', { validateStatus: (status) => status === 302 })
    const redirectUrl = new URL(login.headers.location)
    // example url http://localhost:9009/auth?response_type=code&client_id=foo&redirect_uri=http%3A%2F%2F127.0.0.1%3A5689%2Fsimple-directory%2Fapi%2Fauth%2Foauth-callback&scope=openid%20email%20profile&state=%5B%22wBPeAAdRVJh243oPShZyS%22%2Cnull%2C%22http%3A%2F%2F127.0.0.1%3A5689%2Fsimple-directory%22%2C%22%22%2C%22%22%2C%22%22%5D&display=page&prompt=logi
    assert.equal(redirectUrl.host, 'localhost:9009')
    assert.equal(redirectUrl.pathname, '/auth')
    assert.equal(redirectUrl.searchParams.get('redirect_uri'), 'http://127.0.0.1:5689/simple-directory/api/auth/oauth-callback')
    // TODO: difficult to test the next steps, should we use a mock ?
  })
})
