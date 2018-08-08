const util = require('util')
const testUtils = require('./resources/test-utils')

const {test} = testUtils.prepare(__filename)

test('Try to send mail whithout the secret', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.post('/api/mails', {})
  t.is(res.status, 403)
})

test('Send email to a user', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.post('/api/mails', {
    to: [{type: 'user', id: 'dmeadus0'}],
    subject: 'test',
    text: 'test mail content'
  }, {params: {key: 'testkey'}})
  t.is(res.status, 200)
  await new Promise(resolve => setTimeout(resolve, 50))
  const emails = await util.promisify(test.app.get('maildev').getAllEmail)()
  const email = emails.find(m => m.subject === 'test')
  t.truthy(email)
  t.is(email.envelope.to[0].address, 'dmeadus0@answers.com')
})

test('Send email to members of an organization', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.post('/api/mails', {
    to: [{type: 'organization', id: 'ihMQiGTaY'}],
    subject: 'test2',
    text: 'test mail content 2'
  }, {params: {key: 'testkey'}})
  t.is(res.status, 200)
  await new Promise(resolve => setTimeout(resolve, 50))
  const emails = await util.promisify(test.app.get('maildev').getAllEmail)()
  const email = emails.find(m => m.subject === 'test2')
  t.truthy(email)
  t.is(email.envelope.to.length, 3)
})

test('Send email to members of an organization with a certain role', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.post('/api/mails', {
    to: [{type: 'organization', id: 'ihMQiGTaY', role: 'user'}],
    subject: 'test3',
    text: 'test mail content 2'
  }, {params: {key: 'testkey'}})
  t.is(res.status, 200)
  await new Promise(resolve => setTimeout(resolve, 50))
  const emails = await util.promisify(test.app.get('maildev').getAllEmail)()
  const email = emails.find(m => m.subject === 'test3')
  t.truthy(email)
  t.is(email.envelope.to.length, 2)
})
