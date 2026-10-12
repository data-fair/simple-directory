import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { testEnvAx, createUser } from '../support/axios.ts'
import type { PasswordList } from '../../api/types/index.ts'

test.describe('password lists api', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('should manage password lists', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)

    let check = await adminAx.post('/api/password-lists/_check', { password: 'password1' })
    assert.equal(check.data.found, false)

    const form = new FormData()
    form.append('passwords', new Blob(['password1\npassword2\npassword3\n'], { type: 'text/plain' }), 'passwords.txt')
    const passwordList = (await adminAx.post<PasswordList>('/api/password-lists', form)).data
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
