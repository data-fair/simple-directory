import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'
import jwt from 'jsonwebtoken'

describe('JWKS router and keys management', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('Get, use and rotate signature keys', async () => {
    const keysManager = await import('../api/src/tokens/keys-manager.ts')
    const session = (await import('@data-fair/lib-express/session.js')).default

    // service is initialized with a key
    const ax = await axios()
    let res = await ax.get('/.well-known/jwks.json')
    const key1 = res.data.keys[0]
    assert.ok(key1.kid.startsWith('sd-'))

    // this key is used to sign a session token
    const axAuth1 = await axiosAuth('dmeadus0@answers.com')
    const idToken = (await axAuth1.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token')?.value
    const idTokenSign = (await axAuth1.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token_sign')?.value
    const payload = jwt.decode(idToken + '.' + idTokenSign, { complete: true })
    assert.ok(payload)
    assert.equal(payload.header.kid, key1.kid)
    await axAuth1.get('/api/auth/me')

    // force keys rotation (normally it is base on a delay)
    await keysManager.rotateKeys()
    await keysManager.getSignatureKeys.clear()
    session.init('http://localhost:5690')
    res = await ax.get('/.well-known/jwks.json')
    assert.equal(res.data.keys?.length, 2)
    assert.equal(key1.kid, res.data.keys[1].kid)
    const key2 = res.data.keys[0]
    assert.ok(key2.kid.startsWith('sd-'))
    assert.ok(key2.kid !== key1.kid)

    // the new key can also be used to sign a session token
    const axAuth2 = await axiosAuth('dmeadus0@answers.com')
    const idToken2 = (await axAuth2.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token')?.value
    const idTokenSign2 = (await axAuth2.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token_sign')?.value
    const payload2 = jwt.decode(idToken2 + '.' + idTokenSign2, { complete: true })
    assert.ok(payload2)
    assert.equal(payload2.header.kid, key2.kid)
    await axAuth2.get('/api/auth/me')

    // the old key is still usable
    await axAuth1.get('/api/auth/me')

    // force a second keys rotation
    await keysManager.rotateKeys()
    await keysManager.getSignatureKeys.clear()
    session.init('http://localhost:5690')
    res = await ax.get('/.well-known/jwks.json')
    assert.equal(res.data.keys?.length, 2)
    assert.equal(key2.kid, res.data.keys[1].kid)
    const key3 = res.data.keys[0]
    assert.ok(key3.kid.startsWith('sd-'))
    assert.ok(key3.kid !== key2.kid)
    assert.ok(key3.kid !== key1.kid)

    // the new key can also be used to sign a session token
    const axAuth3 = await axiosAuth('dmeadus0@answers.com')
    const idToken3 = (await axAuth3.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token')?.value
    const idTokenSign3 = (await axAuth3.cookieJar.toJSON())?.cookies.find(c => c.key === 'id_token_sign')?.value
    const payload3 = jwt.decode(idToken3 + '.' + idTokenSign3, { complete: true })
    assert.ok(payload3)
    assert.equal(payload3.header.kid, key3.kid)
    await axAuth2.get('/api/auth/me')

    // the second key is still usable
    await axAuth2.get('/api/auth/me')
    // the first key is no longer usable
    await assert.rejects(axAuth1.get('/api/auth/me'), { status: 401 })
  })
})
