import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, deleteAllEmails, getServerConfig } from '../support/axios.ts'

// A superadmin transfers a user from one site (host/path) to another. See
// docs/architecture/email-trust-and-site-isolation.md — host drives admin rights, so the
// transfer is gated (adminMode), refuses superadmins entirely, and refuses email collisions
// on the target site.
test.describe('user transfer api', () => {
  const host2 = '127.0.0.1:' + process.env.NGINX_PORT2

  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
  })

  // Creates a secondary standalone site (onlyLocal) at host2 owned by the given admin's org.
  // authMode is not settable at creation, so it is patched afterwards (as in the password-renewal tests).
  const createSecondarySite = async (ax: any, id = 'test_transfer_site') => {
    const config = await getServerConfig()
    const anonymousAx = await axios()
    const org = (await ax.post('/api/organizations', { name: 'transfer-org-' + id })).data
    const owner = { type: 'organization', id: org.id, name: org.name }
    await anonymousAx.post('/api/sites',
      { _id: id, owner, host: host2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await ax.patch(`/api/sites/${id}`, { authMode: 'onlyLocal' })
    await testEnvAx.post('/clear-site-cache')
    return org
  }

  test('should transfer a user to a secondary site and back to the main site', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { user } = await createUser('transfer-move@test.com')
    await createSecondarySite(adminAx)

    // main-site record: no host
    assert.equal(user.host, undefined)

    // transfer onto the secondary site
    const transferred = (await adminAx.post(`/api/users/${user.id}/transfer`, { host: host2 })).data
    assert.equal(transferred.host, host2)
    assert.equal(transferred.isAdmin, false)

    // transfer back to the main site (empty target → main)
    const backToMain = (await adminAx.post(`/api/users/${user.id}/transfer`, {})).data
    assert.equal(backToMain.host, undefined)
  })

  test('should refuse to transfer onto a site where the email already exists', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { user: collideUser } = await createUser('transfer-collide@test.com')
    const { user: otherUser } = await createUser('transfer-other@test.com')
    await createSecondarySite(adminAx)

    // make `otherUser` a record carrying the same email, already living on the secondary site
    await testEnvAx.patch('/user/' + encodeURIComponent(otherUser.email), { email: 'transfer-collide@test.com', host: host2 })

    await assert.rejects(
      adminAx.post(`/api/users/${collideUser.id}/transfer`, { host: host2 }),
      { status: 409 }
    )
  })

  test('should refuse to transfer a superadmin in any direction', async () => {
    const { ax: adminAx, user: admin } = await createUser('admin@test.com', true)
    await createSecondarySite(adminAx)

    // admin@test.com is listed in config.admins → never transferable
    await assert.rejects(
      adminAx.post(`/api/users/${admin.id}/transfer`, { host: host2 }),
      { status: 403 }
    )
  })

  test('should refuse the transfer to a non-admin caller', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { user: target } = await createUser('transfer-target@test.com')
    const { ax: plainAx } = await createUser('transfer-plain@test.com')
    await createSecondarySite(adminAx)

    await assert.rejects(
      plainAx.post(`/api/users/${target.id}/transfer`, { host: host2 }),
      { status: 403 }
    )
  })

  test('should refuse a transfer to an unknown site', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { user } = await createUser('transfer-nosite@test.com')

    await assert.rejects(
      adminAx.post(`/api/users/${user.id}/transfer`, { host: 'unknown.example.com' }),
      { status: 400 }
    )
  })
})
