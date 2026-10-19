import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

test.describe('oauth server mongo adapter', () => {
  test.beforeAll(async () => { await initMongo() })

  test.beforeEach(async () => {
    const mongo = (await import('../../api/src/mongo.ts')).default
    for (const name of ['oauth-access-token', 'oauth-refresh-token', 'oauth-session']) {
      await mongo.db.collection(name).deleteMany({})
    }
  })

  test('upsert then find returns the payload', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const adapter = new MongoAdapter('AccessToken')
    await adapter.upsert('test_at1', { grantId: 'g1', foo: 'bar' }, 60)
    assert.deepEqual(await adapter.find('test_at1'), { grantId: 'g1', foo: 'bar' })
  })

  test('find returns undefined once expiresAt is past', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const adapter = new MongoAdapter('AccessToken')
    await adapter.upsert('test_at2', { foo: 'bar' }, 1)
    await new Promise(resolve => setTimeout(resolve, 1100))
    assert.equal(await adapter.find('test_at2'), undefined)
  })

  test('consume marks payload.consumed', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const adapter = new MongoAdapter('RefreshToken')
    await adapter.upsert('test_rt1', { grantId: 'g1' }, 60)
    await adapter.consume('test_rt1')
    const found = await adapter.find('test_rt1')
    assert.equal(typeof found?.consumed, 'number')
  })

  test('revokeByGrantId deletes every document of the grant', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const access = new MongoAdapter('AccessToken')
    const refresh = new MongoAdapter('RefreshToken')
    await access.upsert('test_at3', { grantId: 'g3' }, 60)
    await access.upsert('test_at4', { grantId: 'g3' }, 60)
    await refresh.upsert('test_rt3', { grantId: 'g3' }, 60)
    await access.upsert('test_at5', { grantId: 'other' }, 60)
    await access.revokeByGrantId('g3')
    await refresh.revokeByGrantId('g3')
    assert.equal(await access.find('test_at3'), undefined)
    assert.equal(await access.find('test_at4'), undefined)
    assert.equal(await refresh.find('test_rt3'), undefined)
    assert.ok(await access.find('test_at5'))
  })

  test('findByUid finds a Session by payload.uid', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const adapter = new MongoAdapter('Session')
    await adapter.upsert('test_s1', { uid: 'uid-1' }, 60)
    assert.deepEqual(await adapter.findByUid('uid-1'), { uid: 'uid-1' })
  })

  test('find on Client reads the stored client', async () => {
    const { MongoAdapter } = await import('../../api/src/oauth-server/adapter.ts')
    const adapter = new MongoAdapter('Client')
    await adapter.upsert('test_c1', { client_id: 'test_c1' }, 60)
    assert.deepEqual(await adapter.find('test_c1'), { client_id: 'test_c1' })
  })
})
