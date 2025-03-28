import fs from 'node:fs'
import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, getAllEmails, deleteAllEmails } from './utils/index.ts'
import FormData from 'form-data'

describe('mails', () => {
  before(deleteAllEmails)
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)
  it('Try to send mail whithout the secret', async () => {
    const ax = await axios()
    await assert.rejects(ax.post('/api/mails', {}), (res: any) => res.status === 403)
  })

  it.only('Send email to a user', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'user', id: 'dmeadus0' }],
      subject: 'test',
      text: 'test mail content'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const emails: any[] = await getAllEmails()
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
    const emails: any[] = await getAllEmails()
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
    const emails: any[] = await getAllEmails()
    const email = emails.find(m => m.subject === 'test3')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 2)
  })

  it('Send email to address and with attachments', async () => {
    const ax = await axios()
    const readmeBuffer = fs.readFileSync('./README.md')
    const form = new FormData()
    form.append('body', JSON.stringify({
      to: ['test@test.com'],
      subject: 'test4',
      text: 'test mail content 2',
    }))
    form.append('attachment1', readmeBuffer, 'README.md')
    form.append('attachment2', readmeBuffer, 'README2.md')
    const res = await ax.post('/api/mails', form, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const emails: any[] = await getAllEmails()
    const email = emails.find(m => m.subject === 'test4')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 1)
    assert.equal(email.attachments.length, 2)
    assert.equal(email.attachments[0].fileName, 'README.md')
    assert.equal(email.attachments[0].contentType, 'text/markdown')
    assert.equal(email.attachments[0].length, readmeBuffer.length)
    assert.equal(email.attachments[1].fileName, 'README2.md')
  })
})
