// Prefixed test sub-spaces of /api/test-env: each suite seeds and cleans its own prefix
// (test_<suite>_) without touching the other suites nor the unprefixed accounts.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { axios, testEnvAx, createUser, getServerConfig } from '../../support/axios.ts'

const seedBody = (prefix: string, extra: { userExtra?: any, orgExtra?: any } = {}) => ({
  prefix,
  users: [{ id: `${prefix}user`, firstName: 'Test', lastName: 'User', email: `${prefix}user@test.com`, ...extra.userExtra }],
  organizations: [{ id: `${prefix}org`, name: `Org ${prefix}`, members: [{ id: `${prefix}user`, role: 'admin' }], ...extra.orgExtra }]
})

// read the state straight from mongo, the test API deliberately has no read routes
const findDoc = async (collection: string, filter: any) => {
  const client = await MongoClient.connect((await getServerConfig()).mongo.url)
  try {
    return await client.db().collection(collection).findOne(filter)
  } finally {
    await client.close()
  }
}
const exists = async (collection: 'users' | 'organizations' | 'sites', id: string) => (await findDoc(collection, { _id: id } as any)) !== null

test.describe('prefixed test sub-spaces', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('seed and clean are scoped to the prefix', async () => {
    const resA = await testEnvAx.post('/seed', seedBody('test_a_'))
    assert.equal(resA.status, 200)
    assert.deepEqual(resA.data, { users: 1, organizations: 1 })
    await testEnvAx.post('/seed', seedBody('test_b_'))
    await testEnvAx.post('/seed') // legacy seed, bare test_ ids
    // a test_b_ user is also a member of the test_a_ org
    await testEnvAx.patch('/user/test_b_user@test.com', {
      organizations: [{ id: 'test_b_org', name: 'Org test_b_', role: 'admin' }, { id: 'test_a_org', name: 'Org test_a_', role: 'user' }]
    })

    const res = await testEnvAx.delete('/', { params: { prefix: 'test_a_' } })
    assert.equal(res.status, 204)

    assert.equal(await exists('users', 'test_a_user'), false)
    assert.equal(await exists('organizations', 'test_a_org'), false)
    const bUser = await findDoc('users', { _id: 'test_b_user' })
    assert.ok(bUser)
    assert.deepEqual(bUser.organizations.map((o: any) => o.id), ['test_b_org'])
    assert.equal(await exists('organizations', 'test_b_org'), true)
    assert.equal(await exists('users', 'test_dmeadus0'), true)
  })

  test('test_a_ does not match test_ab_', async () => {
    await testEnvAx.post('/seed', seedBody('test_a_'))
    await testEnvAx.post('/seed', seedBody('test_ab_'))
    await testEnvAx.delete('/', { params: { prefix: 'test_a_' } })
    assert.equal(await exists('users', 'test_a_user'), false)
    assert.equal(await exists('users', 'test_ab_user'), true)
    assert.equal(await exists('organizations', 'test_ab_org'), true)
  })

  test('dynamic users and sites are cleaned by prefix', async () => {
    const config = await getServerConfig()
    await testEnvAx.post('/seed', seedBody('test_a_'))
    await testEnvAx.post('/seed', seedBody('test_b_'))
    await createUser('test_a_new@test.com')
    const anonymousAx = await axios()
    for (const p of ['test_a_', 'test_b_']) {
      await anonymousAx.post('/api/sites',
        { _id: `${p}site`, owner: { type: 'organization', id: `${p}org`, name: `Org ${p}` }, host: `${p}site.localhost:5600` },
        { params: { key: config.secretKeys.sites } })
    }
    assert.equal(await exists('sites', 'test_a_site'), true)

    await testEnvAx.delete('/', { params: { prefix: 'test_a_' } })
    assert.equal(await findDoc('users', { email: 'test_a_new@test.com' }), null)
    assert.equal(await exists('sites', 'test_a_site'), false)
    assert.equal(await exists('sites', 'test_b_site'), true)
  })

  test('seed refuses entries outside the prefix', async () => {
    const bad = [
      seedBody('test_a_', { userExtra: { id: 'test_b_user' } }),
      seedBody('test_a_', { orgExtra: { id: 'test_b_org' } }),
      seedBody('test_a_', { orgExtra: { members: [{ id: 'test_b_user', role: 'user' }] } }),
      seedBody('test_a_', { userExtra: { email: 'other@test.com' } }),
    ]
    for (const body of bad) {
      const res = await testEnvAx.post('/seed', body, { validateStatus: () => true })
      assert.equal(res.status, 400)
    }
    assert.equal(await exists('users', 'test_a_user'), false)
    assert.equal(await exists('organizations', 'test_a_org'), false)
    assert.equal(await exists('organizations', 'test_b_org'), false)
  })

  test('invalid prefixes are refused', async () => {
    for (const prefix of ['test_', 'test_A_', 'a_', 'test_a']) {
      const seed = await testEnvAx.post('/seed', { prefix, users: [], organizations: [] }, { validateStatus: () => true })
      assert.equal(seed.status, 400, prefix)
      const clean = await testEnvAx.delete('/', { params: { prefix }, validateStatus: () => true })
      assert.equal(clean.status, 400, prefix)
    }
  })

  test('seeded memberships carry the department name', async () => {
    const res = await testEnvAx.post('/seed', seedBody('test_a_', {
      orgExtra: {
        departments: [{ id: 'dep1', name: 'Department One' }],
        members: [{ id: 'test_a_user', role: 'user', department: 'dep1' }]
      }
    }))
    assert.equal(res.status, 200)
    const user = await findDoc('users', { _id: 'test_a_user' })
    assert.deepEqual(user?.organizations.map((o: any) => [o.id, o.department, o.departmentName]), [['test_a_org', 'dep1', 'Department One']])
  })

  test('seed replaces a user with the same email and another id', async () => {
    const client = await MongoClient.connect((await getServerConfig()).mongo.url)
    try {
      await client.db().collection('users').insertOne({ _id: 'randomid123' as any, email: 'test_a_user@test.com', name: 'Admin', organizations: [{ id: 'test_a_org', name: 'x', role: 'admin' }] })
    } finally {
      await client.close()
    }
    const res = await testEnvAx.post('/seed', seedBody('test_a_'))
    assert.equal(res.status, 200)
    assert.equal(await exists('users', 'randomid123'), false)
    const client2 = await MongoClient.connect((await getServerConfig()).mongo.url)
    try {
      const users = await client2.db().collection('users').find({ email: 'test_a_user@test.com' }).toArray()
      assert.deepEqual(users.map(u => u._id), ['test_a_user'])
    } finally {
      await client2.close()
    }
  })

  test('an _id in a seed entry cannot bypass the prefix', async () => {
    const bodies = [
      seedBody('test_a_', { userExtra: { _id: 'outside' } }),
      seedBody('test_a_', { orgExtra: { _id: 'outside' } })
    ]
    for (const body of bodies) {
      const res = await testEnvAx.post('/seed', body, { validateStatus: () => true })
      if (res.status === 200) {
        assert.equal(await exists('users', 'outside'), false)
        assert.equal(await exists('organizations', 'outside'), false)
        assert.equal(await exists('users', 'test_a_user'), true)
      } else {
        assert.equal(res.status, 400)
      }
      await testEnvAx.delete('/', { params: { prefix: 'test_a_' } })
    }
  })

  test('replacing a user with the same email also removes its limits and avatars', async () => {
    const client = await MongoClient.connect((await getServerConfig()).mongo.url)
    try {
      const db = client.db()
      await db.collection('users').insertOne({ _id: 'randomid456' as any, email: 'test_a_user@test.com', name: 'Admin', organizations: [] })
      await db.collection('limits').insertOne({ type: 'user', id: 'randomid456', lastUpdate: new Date() } as any)
      await db.collection('avatars').insertOne({ owner: { type: 'user', id: 'randomid456' } } as any)
      const res = await testEnvAx.post('/seed', seedBody('test_a_'))
      assert.equal(res.status, 200)
      assert.equal(await db.collection('limits').countDocuments({ type: 'user', id: 'randomid456' }), 0)
      assert.equal(await db.collection('avatars').countDocuments({ 'owner.id': 'randomid456' }), 0)
    } finally {
      await client.close()
    }
  })

  test('seed requires an email on every user', async () => {
    const body = seedBody('test_a_')
    delete (body.users[0] as any).email
    const res = await testEnvAx.post('/seed', body, { validateStatus: () => true })
    assert.equal(res.status, 400)
    assert.equal(await exists('users', 'test_a_user'), false)
  })

  test('sites without prefix owned by the sub-space and orgs created by its users are cleaned', async () => {
    const config = await getServerConfig()
    await testEnvAx.post('/seed', seedBody('test_a_'))
    const { ax } = await createUser('test_a_new@test.com')
    const org = (await ax.post('/api/organizations', { name: 'created by test_a_' })).data
    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      { _id: 'noprefix_site', owner: { type: 'organization', id: 'test_a_org', name: 'Org test_a_' }, host: 'noprefix-site.localhost:5600' },
      { params: { key: config.secretKeys.sites } })
    assert.equal(await exists('sites', 'noprefix_site'), true)
    assert.equal(await exists('organizations', org.id), true)
    await testEnvAx.delete('/', { params: { prefix: 'test_a_' } })
    assert.equal(await exists('sites', 'noprefix_site'), false)
    assert.equal(await exists('organizations', org.id), false)
  })
})
