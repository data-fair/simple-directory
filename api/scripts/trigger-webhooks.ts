import * as webhooks from '../src/webhooks/service.ts'
import storages from '#storages'

async function main () {
  await storages.init()
  const users = await storages.globalStorage.findUsers({ skip: 0, size: 100000 })
  for (const user of users.results) {
    await webhooks.postUserIdentityWebhook(user)
  }

  const organizations = await storages.globalStorage.findOrganizations({ skip: 0, size: 100000 })
  for (const organization of organizations.results) {
    await webhooks.postOrganizationIdentityWebhook(organization)
  }
}

main()
