import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie } from '../support/axios.ts'
import { withMongo } from '../support/oauth-code-site.ts'

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

  // the guards passed: the dummy response is rejected by parseLoginResponse, an unhandled error (500), not a badIDPResponse redirect
  const assertGuardsPassed = (res: any) => {
    assert.equal(res.status, 500)
  }

  test('should refuse an assertion without the binding cookie, without consuming the relay state', async () => {
    const { anonymousAx, loginInitial, relayState } = await startLogin()
    assert.equal(errorOf(await assertPost(anonymousAx, relayState)), 'badIDPResponse')
    assertGuardsPassed(await assertPost(anonymousAx, relayState, loginBindingCookie(loginInitial)))
  })

  test('should refuse a forged cookie value, without consuming the relay state', async () => {
    const { anonymousAx, loginInitial, relayState } = await startLogin()
    assert.equal(errorOf(await assertPost(anonymousAx, relayState, `sd_login_${relayState}=forged`)), 'badIDPResponse')
    assertGuardsPassed(await assertPost(anonymousAx, relayState, loginBindingCookie(loginInitial)))
  })

  test('should refuse a relay state stored without binding hash', async () => {
    const id = 'test_saml_nobinding'
    await withMongo(db => db.collection('saml2-relay-states').replaceOne({ _id: id } as any,
      { _id: id, createdAt: new Date(), providerId, redirect: 'http://localhost/' } as any, { upsert: true }))
    const anonymousAx = await axios()
    assert.equal(errorOf(await assertPost(anonymousAx, id, `sd_login_${id}=anything`)), 'badIDPResponse')
    await withMongo(db => db.collection('saml2-relay-states').deleteOne({ _id: id } as any))
  })

  test('should accept a relay state only once', async () => {
    const { anonymousAx, loginInitial, relayState } = await startLogin()
    const cookie = loginBindingCookie(loginInitial)
    assertGuardsPassed(await assertPost(anonymousAx, relayState, cookie))
    assert.equal(errorOf(await assertPost(anonymousAx, relayState, cookie)), 'badIDPResponse')
  })
})
