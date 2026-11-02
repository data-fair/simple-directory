import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie } from '../support/axios.ts'

const providerId = 'localhost8080'

const startLogin = async () => {
  const anonymousAx = await axios()
  const loginInitial = await anonymousAx.get(`/api/auth/saml2/${providerId}/login`, { validateStatus: (status: number) => status === 302 })
  const relayState = new URL(loginInitial.headers.location).searchParams.get('RelayState')
  assert.ok(relayState)
  return { anonymousAx, loginInitial, relayState }
}

const assertPost = (anonymousAx: any, relayState: string, cookie?: string) =>
  anonymousAx.post('/api/auth/saml2-assert', new URLSearchParams({ RelayState: relayState, SAMLResponse: 'ZHVtbXk=' }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(cookie ? { Cookie: cookie } : {}) },
    validateStatus: () => true
  })

const errorOf = (res: any) => {
  assert.equal(res.status, 302)
  const redirect = new URL(res.headers.location)
  assert.equal(redirect.pathname, '/simple-directory/login')
  return redirect.searchParams.get('error')
}

test.describe('saml2 relay state binding', () => {
  test('should set a binding cookie when starting the login', async () => {
    const { loginInitial, relayState } = await startLogin()
    const setCookie = (loginInitial.headers['set-cookie'] as string[]).find(c => c.startsWith(`sd_login_${relayState}=`))
    assert.ok(setCookie)
    assert.match(setCookie, /httponly/i)
    assert.match(setCookie, /path=\/simple-directory\/api\/auth\//)
  })

  test('should refuse an assertion without the binding cookie, without consuming the relay state', async () => {
    const { anonymousAx, loginInitial, relayState } = await startLogin()
    assert.equal(errorOf(await assertPost(anonymousAx, relayState)), 'badIDPResponse')
    // the failed attempt did not burn the login: with the cookie the relay state is accepted (and the dummy response fails later)
    const res = await assertPost(anonymousAx, relayState, loginBindingCookie(loginInitial))
    // parseLoginResponse rejects the dummy response, which is not a redirect to badIDPResponse
    assert.notEqual(res.status, 302)
  })

  test('should accept a relay state only once', async () => {
    const { anonymousAx, loginInitial, relayState } = await startLogin()
    const cookie = loginBindingCookie(loginInitial)
    // first use passes the binding and consumption checks, the dummy response is then rejected by the parsing
    await assertPost(anonymousAx, relayState, cookie)
    assert.equal(errorOf(await assertPost(anonymousAx, relayState, cookie)), 'badIDPResponse')
  })
})
