import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'
import FormData from 'form-data'
import type { PasswordList } from '../api/types/index.ts'

process.env.STORAGE_TYPE = 'mongo'

describe('password lists api', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should manage password lists', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)

    let check = await adminAx.post('/api/password-lists/_check', { password: 'password1' })
    assert.equal(check.data.found, false)

    const form = new FormData()
    form.append('passwords', 'password1\npassword2\npassword3\n', 'passwords.txt')
    const passwordList = (await adminAx.post<PasswordList>('/api/password-lists', form.getBuffer(), { headers: form.getHeaders() })).data
    assert.equal(passwordList.count, 3)
    assert.equal(passwordList.name, 'passwords.txt')
    assert.equal(passwordList.active, false)

    // still not found when inactive
    check = await adminAx.post('/api/password-lists/_check', { password: 'password1' })
    assert.equal(check.data.found, false)

    await adminAx.patch('/api/password-lists/' + passwordList._id, { active: true })
    check = await adminAx.post('/api/password-lists/_check', { password: 'password1' })
    assert.equal(check.data.found, true)
  })
})
