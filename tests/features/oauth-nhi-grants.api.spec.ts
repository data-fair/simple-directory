// Connections of an NHI per OAuth client: org admins list and revoke the grants dynamic clients hold.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from '@playwright/test'
import { axios, createUser, testEnvAx } from '../support/axios.ts'
import { nhiBody, subject as nhiSubject } from '../support/nhi.ts'
import {
  startAuthorization, openInteraction, getDetails, postDecision, resume, exchangeCode, tokenRequest, type CodeFlowOptions
} from '../support/oauth-client.ts'
import { siteUrl, issuer, grantRecords, password, setup } from '../support/oauth-code-site.ts'

const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

const registerClient = async () => {
  const res = await axios().post(issuer + '/api/oauth/register', claudeCode(), { validateStatus: () => true })
  assert.equal(res.status, 201, JSON.stringify(res.data))
  return res.data.client_id as string
}

const setupGrants = async () => {
  const base = await setup()
  const { org, ownerAx } = base
  await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }] })
  ownerAx.setOrg(org.id)
  let counter = 0
  const createNhi = async (name: string) =>
    (await ownerAx.post(`/api/organizations/${org.id}/nhis`, nhiBody({ name, subject: nhiSubject + '-' + (counter++) }))).data
  // one complete code flow of a client for an nhi; returns the tokens
  const connect = async (clientId: string, nhiId: string) => {
    const opts: CodeFlowOptions = {
      issuer, clientId, redirectUri: 'http://localhost:40321/callback', scope: 'organizations:read', resource: siteUrl + '/mcp-server/mcp', browserAx: base.userAx
    }
    const { pkce, location } = await startAuthorization(opts)
    const uid = await openInteraction(opts, location)
    await getDetails(opts, uid)
    const decided = await postDecision(opts, uid, {
      decision: 'allow', account: { type: 'organization', id: org.id }, nhi: { id: nhiId }, scopes: ['organizations:read'], lifetime: '30d'
    })
    assert.equal(decided.status, 200, JSON.stringify(decided.data))
    const callback = await resume(opts, decided.data.redirectTo)
    const tokenRes = await exchangeCode(opts, callback.searchParams.get('code')!, pkce.verifier)
    assert.equal(tokenRes.status, 200, JSON.stringify(tokenRes.data))
    return tokenRes.data
  }
  const refresh = (clientId: string, token: string) => tokenRequest(issuer, { grant_type: 'refresh_token', refresh_token: token, client_id: clientId })
  return { ...base, createNhi, connect, refresh }
}

test.describe('oauth nhi connections', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('list, then revoke every grant of a client', async () => {
    const { org, ownerAx, createNhi, connect, refresh } = await setupGrants()
    const nhi = await createNhi('Agent')
    const other = await createNhi('Other agent')
    const clientA = await registerClient()
    const clientB = await registerClient()
    const t1 = await connect(clientA, nhi.id)
    const t2 = await connect(clientA, nhi.id)
    const tB = await connect(clientB, nhi.id)
    const tOther = await connect(clientA, other.id)

    const base = `/api/organizations/${org.id}/nhis/${nhi.id}/oauth-grants`
    const list = (await ownerAx.get(base)).data.results
    assert.equal(list.length, 3)
    assert.equal(list.filter((g: any) => g.clientId === clientA).length, 2)
    const first = list[0]
    assert.equal(first.clientKind, 'dcr')
    assert.ok(first.clientName)
    assert.equal(first.scope, 'organizations:read')
    assert.deepEqual(first.resources, [siteUrl + '/mcp-server/mcp'])
    assert.ok(first.authorizedBy.id && first.createdAt && first.expiresAt)
    assert.equal((await ownerAx.get(`/api/organizations/${org.id}/nhis/${other.id}/oauth-grants`)).data.results.length, 1)

    const res = await ownerAx.delete(base, { params: { clientId: clientA } })
    assert.equal(res.status, 204)
    assert.equal((await ownerAx.get(base)).data.results.length, 1)
    for (const t of [t1, t2]) {
      const r = await refresh(clientA, t.refresh_token)
      assert.equal(r.status, 400)
      assert.equal(r.data.error, 'invalid_grant')
    }
    // the other client and the other nhi are untouched
    assert.equal((await refresh(clientB, tB.refresh_token)).status, 200)
    assert.equal((await refresh(clientA, tOther.refresh_token)).status, 200)
    assert.equal((await grantRecords({ 'subject.id': other.id })).length, 1)
  })

  test('revoke one grant', async () => {
    const { org, ownerAx, createNhi, connect, refresh } = await setupGrants()
    const nhi = await createNhi('Agent')
    const other = await createNhi('Other agent')
    const clientId = await registerClient()
    const t1 = await connect(clientId, nhi.id)
    const t2 = await connect(clientId, nhi.id)
    const tOther = await connect(clientId, other.id)
    const base = `/api/organizations/${org.id}/nhis/${nhi.id}/oauth-grants`
    const list = (await ownerAx.get(base)).data.results
    // newest first: the second connection
    const otherGrant = (await ownerAx.get(`/api/organizations/${org.id}/nhis/${other.id}/oauth-grants`)).data.results[0]
    // a grant of another nhi is not reachable through this one
    await assert.rejects(ownerAx.delete(`${base}/${otherGrant.id}`), { status: 404 })
    assert.equal((await ownerAx.delete(`${base}/${list[0].id}`)).status, 204)
    assert.equal((await ownerAx.get(base)).data.results.length, 1)
    assert.equal((await refresh(clientId, t2.refresh_token)).status, 400)
    assert.equal((await refresh(clientId, t1.refresh_token)).status, 200)
    assert.equal((await refresh(clientId, tOther.refresh_token)).status, 200)
    await assert.rejects(ownerAx.delete(base), { status: 400 })
  })

  test('a member who is not an admin gets 403', async () => {
    const { org, createNhi, connect } = await setupGrants()
    const nhi = await createNhi('Agent')
    const clientId = await registerClient()
    await connect(clientId, nhi.id)
    const { ax: memberAx } = await createUser('oauth-member@test.com', false, password)
    await testEnvAx.patch('/user/oauth-member@test.com', { organizations: [{ id: org.id, name: org.name, role: 'user' }] })
    memberAx.setOrg(org.id)
    const base = `/api/organizations/${org.id}/nhis/${nhi.id}/oauth-grants`
    await assert.rejects(memberAx.get(base), { status: 403 })
    await assert.rejects(memberAx.delete(base, { params: { clientId } }), { status: 403 })
  })

  test('deleting the nhi removes its grants', async () => {
    const { org, ownerAx, createNhi, connect, refresh } = await setupGrants()
    const nhi = await createNhi('Agent')
    const clientId = await registerClient()
    const tokens = await connect(clientId, nhi.id)
    assert.equal((await grantRecords({ 'subject.id': nhi.id })).length, 1)
    assert.equal((await ownerAx.delete(`/api/organizations/${org.id}/nhis/${nhi.id}`)).status, 204)
    assert.equal((await grantRecords({ 'subject.id': nhi.id })).length, 0)
    assert.equal((await refresh(clientId, tokens.refresh_token)).status, 400)
  })
})
