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

test.describe('oauth grant records', () => {
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    for (const name of ['oauth-grants', 'oauth-grant', 'oauth-refresh-token', 'oauth-authorization-code', 'oauth-access-token']) {
      await mongo.db.collection(name).deleteMany({})
    }
  })

  test('create, get and list grant records', async () => {
    const { createGrantRecord, getGrantRecord, listGrantRecords } = await import('../../api/src/oauth-server/grants.ts')
    await createGrantRecord(record('test_g1', 'site-a', 'test_u1', { createdAt: new Date(Date.now() - 2000) }))
    await createGrantRecord(record('test_g2', 'site-b', 'test_u1'))
    await createGrantRecord(record('test_g3', 'nhi-x', 'nhi-x', { subject: { type: 'nhi', id: 'nhi-x' } }))
    await createGrantRecord(record('test_g4', 'site-a', 'test_u1', { expiresAt: new Date(Date.now() - 1000), createdAt: new Date(Date.now() - 5000) }))
    const list = await listGrantRecords({ subjectId: 'test_u1' })
    assert.deepEqual(list.map(r => r._id).slice(0, 2), ['test_g2', 'test_g1'])
    assert.equal(list.length, 3)
    assert.equal((await getGrantRecord('test_g1'))?.clientId, 'site-a')
    assert.equal(await getGrantRecord('test_g4'), undefined)
  })

  test('touchGrantRecord sets lastUsedAt', async () => {
    const { createGrantRecord, getGrantRecord, touchGrantRecord } = await import('../../api/src/oauth-server/grants.ts')
    await createGrantRecord(record('test_g1', 'site-a', 'test_u1'))
    assert.equal((await getGrantRecord('test_g1'))?.lastUsedAt, undefined)
    await touchGrantRecord('test_g1')
    assert.ok((await getGrantRecord('test_g1'))?.lastUsedAt instanceof Date)
  })

  test('revokeGrant deletes provider documents of the grant only', async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    const { createGrantRecord, getGrantRecord, revokeGrant } = await import('../../api/src/oauth-server/grants.ts')
    await createGrantRecord(record('g1', 'site-a', 'test_u1'))
    await mongo.db.collection('oauth-refresh-token').insertMany([{ _id: 'rt1' as any, payload: { grantId: 'g1' } }, { _id: 'rt2' as any, payload: { grantId: 'g2' } }])
    await mongo.db.collection('oauth-authorization-code').insertOne({ _id: 'ac1' as any, payload: { grantId: 'g1' } })
    await mongo.db.collection('oauth-access-token').insertOne({ _id: 'at1' as any, payload: { grantId: 'g1' } })
    await mongo.db.collection('oauth-grant').insertOne({ _id: 'g1' as any, payload: {} })
    assert.equal(await revokeGrant('g1', 'test'), true)
    assert.deepEqual((await mongo.db.collection('oauth-refresh-token').find().toArray()).map(d => d._id), ['rt2'])
    assert.equal(await mongo.db.collection('oauth-authorization-code').countDocuments(), 0)
    assert.equal(await mongo.db.collection('oauth-access-token').countDocuments(), 0)
    assert.equal(await mongo.db.collection('oauth-grant').countDocuments(), 0)
    assert.equal(await getGrantRecord('g1'), undefined)
    assert.equal(await revokeGrant('g1', 'test'), false)
  })

  test('revokeGrants by clientId', async () => {
    const { createGrantRecord, listGrantRecords, revokeGrants } = await import('../../api/src/oauth-server/grants.ts')
    await createGrantRecord(record('test_g1', 'site-a', 'test_u1'))
    await createGrantRecord(record('test_g2', 'site-a', 'test_u2'))
    await createGrantRecord(record('test_g3', 'site-b', 'test_u1'))
    assert.equal(await revokeGrants({ clientId: 'site-a' }, 'test'), 2)
    assert.deepEqual((await listGrantRecords({})).map(r => r._id), ['test_g3'])
  })
})
