import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer } from './utils/index.ts'
import { promisify } from 'node:util'

describe.only('mails', () => {
  before(startApiServer)
  beforeEach(clean)
  after(stopApiServer)
  it.only('Try to send mail whithout the secret', async () => {
    const ax = await axios()
    await assert.rejects(ax.post('/api/mails', {}), (res: any) => res.status === 403)
  })

  it('Send email to a user', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'user', id: 'dmeadus0' }],
      subject: 'test',
      text: 'test mail content'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const mailsTransport = (await import('../api/src/mails/transport.ts')).default
    const emails: any[] = await promisify(mailsTransport.maildev.getAllEmail)()
    const email = emails.find(m => m.subject === 'test')
    assert.ok(email)
    assert.equal(email.envelope.to[0].address, 'dmeadus0@answers.com')
  })

  it('Send email to members of an organization', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'organization', id: 'ihMQiGTaY' }],
      subject: 'test2',
      text: 'test mail content 2'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const mailsTransport = (await import('../api/src/mails/transport.ts')).default
    const emails: any[] = await promisify(mailsTransport.maildev.getAllEmail)()
    const email = emails.find(m => m.subject === 'test2')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 3)
  })

  it('Send email to members of an organization with a certain role', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'organization', id: 'ihMQiGTaY', role: 'user' }],
      subject: 'test3',
      text: 'test mail content 2'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const mailsTransport = (await import('../api/src/mails/transport.ts')).default
    const emails: any[] = await promisify(mailsTransport.maildev.getAllEmail)()
    const email = emails.find(m => m.subject === 'test3')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 2)
  })
})
