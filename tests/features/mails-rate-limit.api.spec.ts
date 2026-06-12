import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, maildevAx, deleteAllEmails, getServerConfig } from '../support/axios.ts'
import { MongoClient } from 'mongodb'
import { RateLimiterMongo } from 'rate-limiter-flexible'

// A unique recipient per test process avoids cross-test interference on the same bucket
const uniqueEmail = (label: string) => `rate-limit-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.com`

let mongoClient: MongoClient
let rateLimiter: RateLimiterMongo

test.describe('mails rate limiting', () => {
  test.beforeAll(async () => {
    const cfg = await getServerConfig()
    mongoClient = await MongoClient.connect(cfg.mongo.url)
    rateLimiter = new RateLimiterMongo({
      storeClient: mongoClient,
      dbName: mongoClient.db().databaseName,
      keyPrefix: 'sd-rate-limiter-mail',
      points: cfg.mailsRateLimit.points,
      duration: cfg.mailsRateLimit.duration
    })
    // give the limiter time to ensure its underlying collection exists
    await rateLimiter.get('warmup')
  })

  test.afterAll(async () => {
    if (mongoClient) await mongoClient.close()
  })

  test.beforeEach(async () => {
    await deleteAllEmails()
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Delivers email to a fresh recipient (sanity)', async () => {
    const ax = await axios()
    const to = uniqueEmail('fresh')
    const res = await ax.post('/api/mails', {
      to: [to],
      subject: 'rate-limit-sanity',
      text: 'hello'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 100))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'rate-limit-sanity')
    assert.ok(email, 'expected a delivered email for fresh recipient')
    assert.ok(email.to.some((t: any) => t.address === to), 'expected the fresh recipient to be in the to list')
  })

  test('Drops email to a recipient whose bucket is already full', async () => {
    const ax = await axios()
    const to = uniqueEmail('victim')

    const cfg = await getServerConfig()
    // pre-fill the rate-limit bucket up to the limit so the next consume() rejects
    await rateLimiter.set(to.toLowerCase(), cfg.mailsRateLimit.points, cfg.mailsRateLimit.duration * 1000)

    const res = await ax.post('/api/mails', {
      to: [to],
      subject: 'rate-limit-victim',
      text: 'should be dropped'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)

    await new Promise(resolve => setTimeout(resolve, 100))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'rate-limit-victim')
    assert.ok(!email, 'expected no email delivered to a rate-limited recipient')
  })

  test('Multi-recipient send filters out only the rate-limited address', async () => {
    const ax = await axios()
    const victim = uniqueEmail('multi-victim')
    const fresh = uniqueEmail('multi-fresh')

    const cfg = await getServerConfig()
    await rateLimiter.set(victim.toLowerCase(), cfg.mailsRateLimit.points, cfg.mailsRateLimit.duration * 1000)

    // a single `to` string with a comma exercises sendMail's multi-recipient split path
    const res = await ax.post('/api/mails', {
      to: [`${victim}, ${fresh}`],
      subject: 'rate-limit-mixed',
      text: 'partial delivery'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)

    await new Promise(resolve => setTimeout(resolve, 100))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'rate-limit-mixed')
    assert.ok(email, 'expected the email to be delivered with the non-limited recipient')
    const addresses = email.to.map((t: any) => t.address)
    assert.ok(addresses.includes(fresh), 'expected the fresh recipient to receive the email')
    assert.ok(!addresses.includes(victim), 'expected the rate-limited recipient to be filtered out')
  })
})
