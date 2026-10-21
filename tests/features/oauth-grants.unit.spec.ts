import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

const record = (id: string, clientId: string, subjectId: string, extra: Record<string, any> = {}) => ({
  _id: id,
  issuer: 'http://localhost',
  clientId,
  clientName: clientId,
  clientKind: 'site' as const,
  subject: { type: 'user' as const, id: subjectId },
  account: { type: 'user' as const, id: subjectId },
  scope: 'a',
  resources: [],
  authorizedBy: { id: subjectId, name: 'Test' },
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60000),
  ...extra
})

// a provider Grant document then its SD record, as createConsentGrant does
const createGrant = async (r: ReturnType<typeof record>) => {
  const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
  const { saveGrantRecord } = await import('../../api/src/oauth-server/grants.ts')
  await new MongoAdapter('Grant').upsert(r._id, { accountId: r.subject.id, clientId: r.clientId }, 60)
  const { _id, ...rest } = r
  await saveGrantRecord(_id, rest)
}

test.describe('oauth grant records', () => {
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    for (const name of ['oauth-grant', 'oauth-refresh-token', 'oauth-authorization-code', 'oauth-access-token']) {
      await mongo.db.collection(name).deleteMany({})
    }
  })

  test('create, get and list grant records', async () => {
    const { getGrantRecord, listGrantRecords } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1', { createdAt: new Date(Date.now() - 2000) }))
    await createGrant(record('test_g2', 'site-b', 'test_u1'))
    await createGrant(record('test_g3', 'nhi-x', 'nhi-x', { subject: { type: 'nhi', id: 'nhi-x' } }))
    await createGrant(record('test_g4', 'site-a', 'test_u1', { expiresAt: new Date(Date.now() - 1000), createdAt: new Date(Date.now() - 5000) }))
    const list = await listGrantRecords({ subjectId: 'test_u1' })
    assert.deepEqual(list.map(r => r._id).slice(0, 2), ['test_g2', 'test_g1'])
    assert.equal(list.length, 2, 'expired records are not listed')
    assert.equal((await getGrantRecord('test_g1'))?.clientId, 'site-a')
    assert.equal(await getGrantRecord('test_g4'), undefined)
  })

  test('touchGrantRecord sets lastUsedAt', async () => {
    const { getGrantRecord, touchGrantRecord } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1'))
    assert.equal((await getGrantRecord('test_g1'))?.lastUsedAt, undefined)
    await touchGrantRecord('test_g1')
    assert.ok((await getGrantRecord('test_g1'))?.lastUsedAt instanceof Date)
  })

  test('revokeGrant deletes provider documents of the grant only', async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    const { getGrantRecord, revokeGrant } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('g1', 'site-a', 'test_u1'))
    await mongo.db.collection('oauth-refresh-token').insertMany([{ _id: 'rt1' as any, payload: { grantId: 'g1' } }, { _id: 'rt2' as any, payload: { grantId: 'g2' } }])
    await mongo.db.collection('oauth-authorization-code').insertOne({ _id: 'ac1' as any, payload: { grantId: 'g1' } })
    assert.equal(await revokeGrant('g1', 'test'), true)
    assert.deepEqual((await mongo.db.collection('oauth-refresh-token').find().toArray()).map(d => d._id), ['rt2'])
    assert.equal(await mongo.db.collection('oauth-authorization-code').countDocuments(), 0)
    assert.equal(await mongo.db.collection('oauth-grant').countDocuments(), 0)
    assert.equal(await getGrantRecord('g1'), undefined)
    assert.equal(await revokeGrant('g1', 'test'), false)
  })

  test('revokeGrants by clientId', async () => {
    const { listGrantRecords, revokeGrants } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1'))
    await createGrant(record('test_g2', 'site-a', 'test_u2'))
    await createGrant(record('test_g3', 'site-b', 'test_u1'))
    assert.equal(await revokeGrants({ clientId: 'site-a' }, 'test'), 2)
    assert.deepEqual((await listGrantRecords({})).map(r => r._id), ['test_g3'])
  })

  test('the provider upsert keeps the sd record', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const { getGrantRecord } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1'))
    await new MongoAdapter('Grant').upsert('test_g1', { accountId: 'test_u1', clientId: 'site-a', changed: true }, 60)
    assert.equal((await getGrantRecord('test_g1'))?.clientId, 'site-a')
    assert.equal((await new MongoAdapter('Grant').find('test_g1'))?.changed, true)
  })

  test('destroying the provider grant removes the record', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const { getGrantRecord } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1'))
    await new MongoAdapter('Grant').destroy('test_g1')
    assert.equal(await getGrantRecord('test_g1'), undefined)
  })

  test('revokeGrants by sessionId', async () => {
    const { listGrantRecords, revokeGrants } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1', { sessionId: 's1' }))
    await createGrant(record('test_g2', 'site-b', 'test_u2'))
    assert.equal(await revokeGrants({ sessionId: 's1' }, 'test'), 1)
    assert.deepEqual((await listGrantRecords({})).map(r => r._id), ['test_g2'])
  })

  test('revokeGrants refuses an empty filter', async () => {
    const { getGrantRecord, revokeGrants } = await import('../../api/src/oauth-server/grants.ts')
    await createGrant(record('test_g1', 'site-a', 'test_u1'))
    for (const filter of [{}, { subjectId: '' }, { clientId: '', subjectId: undefined }]) {
      await assert.rejects(revokeGrants(filter, 'test'), /filter/, JSON.stringify(filter))
    }
    assert.ok(await getGrantRecord('test_g1'))
  })
})
