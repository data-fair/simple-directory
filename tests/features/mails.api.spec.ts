import fs from 'node:fs'
import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, maildevAx, deleteAllEmails } from '../support/axios.ts'
import FormData from 'form-data'

const findEmail = async (subject: string) => {
  await new Promise(resolve => setTimeout(resolve, 50))
  const emails: any[] = (await maildevAx.get('/email')).data
  return emails.find(m => m.subject === subject)
}

test.describe('mails', () => {
  test.beforeEach(async () => {
    await deleteAllEmails()
    await testEnvAx.delete('/')
    await testEnvAx.post('/seed')
  })

  test('Try to send mail whithout the secret', async () => {
    const ax = await axios()
    await assert.rejects(ax.post('/api/mails', {}), (res: any) => res.status === 401)
  })

  test('Send email to a user', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'user', id: 'test_dmeadus0' }],
      subject: 'test',
      text: 'test mail content'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'test')
    assert.ok(email)
    assert.equal(email.envelope.to[0].address, 'dmeadus0@answers.com')
    assert.equal(email.text, 'test mail content')
    assert.ok(email.html.includes('test mail content'))
    assert.ok(!email.html.includes('htmlCaption'))
  })

  test('Send email to members of an organization', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'organization', id: 'test_ihMQiGTaY' }],
      subject: 'test2',
      text: 'test mail content 2'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'test2')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 3)
  })

  test('Send email to members of an organization with a certain role', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: [{ type: 'organization', id: 'test_ihMQiGTaY', role: 'user' }],
      subject: 'test3',
      text: 'test mail content 2'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    await new Promise(resolve => setTimeout(resolve, 50))
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'test3')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 2)
  })

  test('Plain text body is HTML-escaped in the rendered email', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: ['injection-text@test.com'],
      subject: 'injection-text',
      text: 'hello <script>alert(1)</script>\nnew line'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    const email = await findEmail('injection-text')
    assert.ok(email)
    // plain-text part stays as-is so the recipient sees the original text in a text client
    assert.equal(email.text, 'hello <script>alert(1)</script>\nnew line')
    // html part has the script escaped and newlines turned into <br>
    assert.ok(email.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'),
      'html should contain the escaped script')
    assert.ok(!email.html.includes('<script>alert(1)</script>'),
      'html must not contain a raw <script> tag')
    assert.ok(email.html.includes('hello &lt;script&gt;alert(1)&lt;/script&gt;<br>new line'),
      'newlines should become <br>')
  })

  test('Caller-supplied html is sanitized', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: ['injection-html@test.com'],
      subject: 'injection-html',
      html: '<p>hello</p><script>alert(1)</script><b>kept</b><img src=x onerror=alert(2)>'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    const email = await findEmail('injection-html')
    assert.ok(email)
    assert.ok(email.html.includes('<p>hello</p>'), 'safe tags should survive')
    assert.ok(email.html.includes('<b>kept</b>'), 'safe tags should survive')
    assert.ok(!email.html.includes('<script'), '<script> should be stripped')
    assert.ok(!email.html.includes('onerror'), 'event handlers should be stripped')
    // MJML compiles the template logo to an <img>; the attacker <img src=x onerror=…> should
    // not appear — check by its unique src
    assert.ok(!email.html.match(/<img[^>]*src=["']?x["']?/), 'attacker image should be stripped')
  })

  test('javascript: hrefs are stripped from caller html', async () => {
    const ax = await axios()
    const res = await ax.post('/api/mails', {
      to: ['injection-href@test.com'],
      subject: 'injection-href',
      html: '<a href="javascript:alert(1)">click</a> <a href="https://example.com/ok">ok</a>'
    }, { params: { key: 'testkey' } })
    assert.equal(res.status, 200)
    const email = await findEmail('injection-href')
    assert.ok(email)
    assert.ok(!email.html.includes('javascript:'), 'javascript: scheme must be dropped')
    assert.ok(email.html.includes('https://example.com/ok'), 'http(s) href should survive')
  })

  test('Contact form: portal-built html structure renders, dangerous tags stripped', async () => {
    await testEnvAx.patch('/config', { anonymousContactForm: true })
    const ax = await axios()
    const token = (await ax.get('/api/auth/anonymous-action')).data
    // the portal contact form composes an HTML body client-side; reproduce a
    // representative payload mixing safe structure with an injected script
    const res = await ax.post('/api/mails/contact', {
      token,
      from: 'visitor@test.com',
      subject: 'contact-injection',
      text: '<ul><li><strong>Subject</strong> : hi</li></ul><p>body<script>alert(1)</script></p>'
    })
    assert.equal(res.status, 200)
    const email = await findEmail('contact-injection')
    assert.ok(email)
    assert.ok(email.html.includes('<strong>Subject</strong>'), 'safe structural tags should render')
    assert.ok(email.html.includes('<li>'), 'list structure should survive')
    assert.ok(!email.html.includes('<script'), '<script> tag must be stripped')
    assert.ok(!email.html.includes('alert(1)'), 'script content must be stripped')
  })

  test('Send email to address and with attachments', async () => {
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
    const emails: any[] = (await maildevAx.get('/email')).data
    const email = emails.find((m: any) => m.subject === 'test4')
    assert.ok(email)
    assert.equal(email.envelope.to.length, 1)
    assert.equal(email.attachments.length, 2)
    assert.equal(email.attachments[0].fileName, 'README.md')
    assert.equal(email.attachments[0].contentType, 'text/markdown')
    assert.equal(email.attachments[0].length, readmeBuffer.length)
    assert.equal(email.attachments[1].fileName, 'README2.md')
  })
})
