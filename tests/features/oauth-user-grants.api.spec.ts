import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, createUser, testEnvAx, waitForMail } from '../support/axios.ts'
import { runCodeFlow, tokenRequest, startAuthorization, browse } from '../support/oauth-client.ts'
import { issuer, password, grantRecords, setup } from '../support/oauth-code-site.ts'

const status = (code: number) => (err: any) => { assert.equal(err.status, code); return true }

const refresh = (clientId: string, refreshToken: string) =>
  tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId })

const assertRefresh = async (clientId: string, refreshToken: string, expected: number, label: string) => {
  const res = await refresh(clientId, refreshToken)
  assert.equal(res.status, expected, `${label}: ${JSON.stringify(res.data)}`)
}

// a second browser of the same user: a second server session
const secondLogin = () => axiosAuth({ email: 'oauth-code-user@test.com', password, directoryUrl: issuer, axiosOpts: { baseURL: issuer } })

test.describe('oauth connected applications', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('a user lists then revokes their grant', async () => {
    const { org, user, userAx, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow({ decision: { account: { type: 'organization', id: org.id } } }))
    const list = (await userAx.get(`/api/users/${user.id}/oauth-grants`)).data.results
    assert.equal(list.length, 1)
    assert.equal(list[0].clientId, clientId)
    assert.equal(list[0].clientName, 'Dash')
    assert.equal(list[0].clientKind, 'site')
    assert.deepEqual(list[0].account, { type: 'organization', id: org.id })
    assert.equal(list[0].scope, 'organizations:read')
    assert.ok(list[0].createdAt && list[0].expiresAt)

    const res = await userAx.delete(`/api/users/${user.id}/oauth-grants/${list[0].id}`)
    assert.equal(res.status, 204)
    assert.equal((await userAx.get(`/api/users/${user.id}/oauth-grants`)).data.results.length, 0)
    assert.equal((await grantRecords({ clientId })).length, 0)
    const refresh = await tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: clientId })
    assert.equal(refresh.status, 400, JSON.stringify(refresh.data))
    assert.equal(refresh.data.error, 'invalid_grant')
  })

  test('another user can neither list nor revoke', async () => {
    const { user, userAx, flow } = await setup()
    await runCodeFlow(flow())
    const grantId = (await userAx.get(`/api/users/${user.id}/oauth-grants`)).data.results[0].id
    const { ax: otherAx, user: other } = await createUser('oauth-other@test.com', false, password, issuer)
    await assert.rejects(otherAx.get(`/api/users/${user.id}/oauth-grants`), status(403))
    await assert.rejects(otherAx.delete(`/api/users/${user.id}/oauth-grants/${grantId}`), status(403))
    // through their own path, the id of someone else's grant does not exist
    await assert.rejects(otherAx.delete(`/api/users/${other.id}/oauth-grants/${grantId}`), status(404))
    assert.equal((await otherAx.get(`/api/users/${other.id}/oauth-grants`)).data.results.length, 0)
    assert.equal((await userAx.get(`/api/users/${user.id}/oauth-grants`)).data.results.length, 1)
  })

  test('a superadmin in admin mode lists the grants of a user', async () => {
    const { user, adminAx, flow } = await setup()
    await runCodeFlow(flow())
    assert.equal((await adminAx.get(`/api/users/${user.id}/oauth-grants`)).data.results.length, 1)
  })

  test('consent without the exchange cookie is refused', async () => {
    const { userAx, flow } = await setup()
    ;(userAx as any).cookieJar.setCookieSync('id_token_ex=; Path=/simple-directory/; Expires=Thu, 01 Jan 1970 00:00:00 GMT', new URL(issuer).origin)
    const { location } = await startAuthorization(flow())
    const entry = await browse(userAx, location)
    assert.equal(entry.status, 302)
    assert.equal(new URL(entry.headers.location).searchParams.get('error'), 'forbidden')
  })

  test('revoking all sessions revokes the grants', async () => {
    const { user, adminAx, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    await adminAx.delete(`/api/users/${user.id}/sessions`)
    await assertRefresh(clientId, tokens.refresh_token, 400, 'after revoking the sessions')
  })

  test('revoking the consenting session revokes its grants only', async () => {
    const { user, adminAx, clientId, flow } = await setup()
    const first = await runCodeFlow(flow())
    const second = await runCodeFlow(flow({ browserAx: await secondLogin() }))
    const records = (await grantRecords({ clientId })).sort((a, b) => a.createdAt - b.createdAt)
    assert.equal(records.length, 2)
    assert.ok(records[0].sessionId && records[1].sessionId && records[0].sessionId !== records[1].sessionId, 'each grant records its server session')
    await adminAx.delete(`/api/users/${user.id}/sessions/${records[0].sessionId}`)
    await assertRefresh(clientId, first.tokens.refresh_token, 400, 'grant of the deleted session')
    await assertRefresh(clientId, second.tokens.refresh_token, 200, 'grant of the other session')
  })

  test('logout keeps the grants', async () => {
    const { userAx, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    await userAx.delete('/api/auth')
    await assertRefresh(clientId, tokens.refresh_token, 200, 'after logout')
  })

  test('a password change revokes the grants', async () => {
    const { user, clientId, flow } = await setup()
    const { tokens } = await runCodeFlow(flow())
    const anonymAx = axios({ baseURL: issuer })
    const mail = await waitForMail(
      () => anonymAx.post('/api/auth/action', { email: 'oauth-code-user@test.com', action: 'changePassword', target: issuer + '/login' }),
      (m: any) => m.to === 'oauth-code-user@test.com' && m.link?.includes('action_token')
    )
    const actionToken = new URL(mail.link).searchParams.get('action_token')
    await anonymAx.post(`/api/users/${user.id}/password`, { password: 'TestPasswd02' }, { params: { action_token: actionToken } })
    await assertRefresh(clientId, tokens.refresh_token, 400, 'after the password change')
  })

  test('anonymous requests are refused', async () => {
    const { user } = await setup()
    await assert.rejects((await axios({ baseURL: issuer })).get(`/api/users/${user.id}/oauth-grants`), status(401))
  })
})
