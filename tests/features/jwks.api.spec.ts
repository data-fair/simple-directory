import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, testEnvAx, devApiUrl } from '../support/axios.ts'

test.describe('JWKS router and keys management', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Get, use and rotate signature keys', async () => {
    // service is initialized with a key
    const ax = await axios()
    let res = await ax.get('/.well-known/jwks.json')
    const key1 = res.data.keys[0]
    assert.ok(key1.kid.startsWith('sd-'))

    // this key is used to sign a session token
    const axAuth1 = await axiosAuth('dmeadus0@answers.com')
    const idToken = (await axAuth1.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token')?.value
    const idTokenSign = (await axAuth1.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token_sign')?.value
    // decode the JWT header to check the kid without jsonwebtoken
    const headerB64 = (idToken + '.' + idTokenSign).split('.')[0]
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())
    assert.equal(header.kid, key1.kid)
    await axAuth1.get('/api/auth/me')

    // force keys rotation via dev API
    const devAx = await axios({ baseURL: devApiUrl })
    await devAx.post('/api/test-env/rotate-keys')
    res = await ax.get('/.well-known/jwks.json')
    assert.equal(res.data.keys?.length, 2)
    assert.equal(key1.kid, res.data.keys[1].kid)
    const key2 = res.data.keys[0]
    assert.ok(key2.kid.startsWith('sd-'))
    assert.ok(key2.kid !== key1.kid)

    // the new key can also be used to sign a session token
    const axAuth2 = await axiosAuth('dmeadus0@answers.com')
    const idToken2 = (await axAuth2.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token')?.value
    const idTokenSign2 = (await axAuth2.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token_sign')?.value
    const header2 = JSON.parse(Buffer.from((idToken2 + '.' + idTokenSign2).split('.')[0], 'base64url').toString())
    assert.equal(header2.kid, key2.kid)
    await axAuth2.get('/api/auth/me')

    // the old key is still usable
    await axAuth1.get('/api/auth/me')

    // force a second keys rotation
    await devAx.post('/api/test-env/rotate-keys')
    res = await ax.get('/.well-known/jwks.json')
    assert.equal(res.data.keys?.length, 2)
    assert.equal(key2.kid, res.data.keys[1].kid)
    const key3 = res.data.keys[0]
    assert.ok(key3.kid.startsWith('sd-'))
    assert.ok(key3.kid !== key2.kid)
    assert.ok(key3.kid !== key1.kid)

    // the new key can also be used to sign a session token
    const axAuth3 = await axiosAuth('dmeadus0@answers.com')
    const idToken3 = (await axAuth3.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token')?.value
    const idTokenSign3 = (await axAuth3.cookieJar.toJSON())?.cookies.find((c: any) => c.key === 'id_token_sign')?.value
    const header3 = JSON.parse(Buffer.from((idToken3 + '.' + idTokenSign3).split('.')[0], 'base64url').toString())
    assert.equal(header3.kid, key3.kid)
    await axAuth2.get('/api/auth/me')

    // the second key is still usable
    await axAuth2.get('/api/auth/me')
    // the first key is no longer usable
    await assert.rejects(axAuth1.get('/api/auth/me'), { status: 401 })
  })
})
