const webhooks = require('../server/webhooks')
const storages = require('../server/storages')

async function main() {
  const storage = await storages.init()
  const users = await storage.findUsers({ skip: 0, size: 100000 })
  await webhooks.sendUsersWebhooks(users.results)
  const organizations = await storage.findOrganizations({ skip: 0, size: 100000 })
  await webhooks.sendOrganizationsWebhooks(organizations.results)
}

main()
