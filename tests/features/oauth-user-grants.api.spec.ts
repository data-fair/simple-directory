import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, createUser, testEnvAx } from '../support/axios.ts'
import { runCodeFlow, tokenRequest } from '../support/oauth-client.ts'
import { issuer, password, grantRecords, setup } from '../support/oauth-code-site.ts'

const status = (code: number) => (err: any) => { assert.equal(err.status, code); return true }

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

  test('anonymous requests are refused', async () => {
    const { user } = await setup()
    await assert.rejects((await axios({ baseURL: issuer })).get(`/api/users/${user.id}/oauth-grants`), status(401))
  })
})
