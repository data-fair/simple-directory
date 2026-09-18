import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from '@playwright/test'
import { axios, createUser, testEnvAx, uploadAvatar, testPng, testPng2 } from '../support/axios.ts'

const download = async (ax: any, path: string) => Buffer.from((await ax.get(path, { responseType: 'arraybuffer' })).data)

// an unknown owner answers 404 with a static placeholder image in the body, so that <img> tags
// pointing at a deleted account still render something
const assertUnknown = async (ax: any, path: string, placeholder: string) => {
  const expected = await readFile(resolve(import.meta.dirname, '../../api/resources', placeholder))
  await assert.rejects(ax.get(path, { responseType: 'arraybuffer' }), (err: any) => {
    assert.equal(err.status, 404)
    assert.equal(err.headers['content-type'], 'image/png')
    assert.deepEqual(Buffer.from(err.data), expected)
    return true
  })
}

test.describe('avatars api', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('should answer an unknown owner with a 404 carrying a placeholder image', async () => {
    const ax = await axios()
    await assertUnknown(ax, '/api/avatars/user/unknown-user/avatar.png', 'unknown-user.png')
    await assertUnknown(ax, '/api/avatars/organization/unknown-org/avatar.png', 'unknown-organization.png')
    await assertUnknown(ax, '/api/avatars/organization/unknown-org/unknown-dep/avatar.png', 'unknown-department.png')
  })

  test('should delete the avatar of a deleted user', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { ax, user } = await createUser('avatar-deleted@test.com')
    const path = `/api/avatars/user/${user.id}/avatar.png`
    assert.equal((await uploadAvatar(ax, path)).status, 201)
    assert.deepEqual(await download(ax, path), testPng)

    await adminAx.delete(`/api/users/${user.id}`)

    // an orphan uploaded avatar would still be served as is, the placeholder proves it is gone
    await assertUnknown(adminAx, path, 'unknown-user.png')
  })

  test('should keep the avatars of an organization and of its departments apart', async () => {
    const { ax } = await createUser('avatar-org-dep@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Avatar org dep', departments: [{ id: 'dep1', name: 'Avatar dep' }] })).data
    ax.setOrg(org.id)
    const orgPath = `/api/avatars/organization/${org.id}/avatar.png`
    const depPath = `/api/avatars/organization/${org.id}/dep1/avatar.png`

    // the department first: a filter on the organization that ignores the department would
    // pick the department's avatar for the organization, then overwrite it
    assert.equal((await uploadAvatar(ax, depPath, testPng2)).status, 201)
    assert.notDeepEqual(await download(ax, orgPath), testPng2)
    assert.equal((await uploadAvatar(ax, orgPath, testPng)).status, 201)
    assert.deepEqual(await download(ax, orgPath), testPng)
    assert.deepEqual(await download(ax, depPath), testPng2)
  })

  test('should delete the avatars of a deleted organization and of its departments', async () => {
    const { ax } = await createUser('avatar-org-admin@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Avatar org', departments: [{ id: 'dep1', name: 'Avatar dep' }] })).data
    ax.setOrg(org.id)
    const dep = org.departments[0]
    const orgPath = `/api/avatars/organization/${org.id}/avatar.png`
    const depPath = `/api/avatars/organization/${org.id}/${dep.id}/avatar.png`
    assert.equal((await uploadAvatar(ax, orgPath)).status, 201)
    assert.equal((await uploadAvatar(ax, depPath)).status, 201)
    assert.deepEqual(await download(ax, orgPath), testPng)
    assert.deepEqual(await download(ax, depPath), testPng)

    const { ax: adminAx } = await createUser('admin@test.com', true)
    await adminAx.delete(`/api/organizations/${org.id}`)

    await assertUnknown(ax, orgPath, 'unknown-organization.png')
    await assertUnknown(ax, depPath, 'unknown-department.png')
  })

  test('should delete the avatar of a department removed from an organization', async () => {
    const { ax } = await createUser('avatar-dep-admin@test.com')
    const org = (await ax.post('/api/organizations', { name: 'Avatar dep org', departments: [{ id: 'kept', name: 'Kept dep' }, { id: 'removed', name: 'Removed dep' }] })).data
    ax.setOrg(org.id)
    const [kept, removed] = org.departments
    const keptPath = `/api/avatars/organization/${org.id}/${kept.id}/avatar.png`
    const removedPath = `/api/avatars/organization/${org.id}/${removed.id}/avatar.png`
    assert.equal((await uploadAvatar(ax, keptPath)).status, 201)
    assert.equal((await uploadAvatar(ax, removedPath)).status, 201)

    await ax.patch(`/api/organizations/${org.id}`, { departments: [kept] })

    assert.deepEqual(await download(ax, keptPath), testPng)
    await assertUnknown(ax, removedPath, 'unknown-department.png')
  })

  test('should delete a custom avatar and revert to default initials avatar', async () => {
    const { ax, user } = await createUser('avatar-reset@test.com')
    const path = `/api/avatars/user/${user.id}/avatar.png`

    const initialRes = await ax.get(path, { responseType: 'arraybuffer' })
    assert.equal(initialRes.headers['x-avatar-custom'], 'false')

    assert.equal((await uploadAvatar(ax, path)).status, 201)
    const customRes = await ax.get(path, { responseType: 'arraybuffer' })
    assert.equal(customRes.headers['x-avatar-custom'], 'true')
    assert.deepEqual(Buffer.from(customRes.data), testPng)

    assert.equal((await ax.delete(path)).status, 204)
    const revertedRes = await ax.get(path, { responseType: 'arraybuffer' })
    assert.equal(revertedRes.headers['x-avatar-custom'], 'false')
    assert.notDeepEqual(Buffer.from(revertedRes.data), testPng)
  })
})
