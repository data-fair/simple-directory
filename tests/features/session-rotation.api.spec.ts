import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axiosAuth, testEnvAx, directoryUrl } from '../support/axios.ts'
import type { AxiosAuthInstance } from '@data-fair/lib-node/axios-auth.js'

const cookieUrl = new URL(directoryUrl).origin

// raw id_token_ex value from a response's set-cookie headers
const readExchangeToken = (res: any) => {
  const setCookies: string[] = res.headers['set-cookie'] ?? []
  const exCookie = setCookies.find((c: string) => c.startsWith('id_token_ex='))
  assert.ok(exCookie, 'missing id_token_ex set-cookie header')
  return exCookie.match(/^id_token_ex=([^;]+)/)![1]
}

const readJti = (res: any) => JSON.parse(Buffer.from(readExchangeToken(res).split('.')[1], 'base64url').toString()).jti

// replay an old exchange token, as a thief holding a copy of the cookie would
const replayExchangeToken = (ax: AxiosAuthInstance, token: string) => {
  ax.cookieJar.setCookieSync(`id_token_ex=${token}; Path=/simple-directory/`, cookieUrl)
}

const readUserSessions = async (userId: string) => {
  const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
  return (await adminAx.get(`/api/users/${userId}`)).data.sessions as any[]
}

test.describe('Exchange token rotation', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('keepalive rotates the exchange token', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com')
    const jti1 = readJti(await ax.post('/api/auth/keepalive'))
    const jti2 = readJti(await ax.post('/api/auth/keepalive'))
    assert.ok(jti1, 'exchange token should carry a jti')
    assert.notEqual(jti1, jti2)
  })

  test('replaying a rotated out exchange token kills the session', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com') as AxiosAuthInstance
    const stolenToken = readExchangeToken(await ax.post('/api/auth/keepalive'))
    // two more rotations: the stolen token is no longer the previous one either
    await ax.post('/api/auth/keepalive')
    const sessionId = JSON.parse(Buffer.from(readExchangeToken(await ax.post('/api/auth/keepalive')).split('.')[1], 'base64url').toString()).session

    assert.ok((await readUserSessions('test_dmeadus0')).some(s => s.id === sessionId))

    replayExchangeToken(ax, stolenToken)
    await assert.rejects(ax.post('/api/auth/keepalive'), (err: any) => err.status === 401)

    // the session was revoked server side, the legitimate client is logged out too
    assert.ok(!(await readUserSessions('test_dmeadus0')).some(s => s.id === sessionId))
  })

  test('replaying the previous exchange token during the grace window is accepted', async () => {
    const ax = await axiosAuth('dmeadus0@answers.com') as AxiosAuthInstance
    // two tabs racing on the same keepalive: the second one still holds the previous token
    const previousToken = readExchangeToken(await ax.post('/api/auth/keepalive'))
    const currentJti = readJti(await ax.post('/api/auth/keepalive'))
    assert.ok(currentJti, 'exchange token should carry a jti')

    replayExchangeToken(ax, previousToken)
    const res = await ax.post('/api/auth/keepalive')
    assert.equal(res.status, 204)
    // no new rotation, the racing tab simply converges on the current token
    assert.equal(readJti(res), currentJti)
    assert.equal((await ax.get('/api/auth/me')).data.email, 'dmeadus0@answers.com')
  })
})
