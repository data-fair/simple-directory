const webhooks = require('../server/webhooks')
const storages = require('../server/storages')

async function main() {
  const storage = await storages.init()
  const users = await storage.findUsers()
  await webhooks.sendUsersWebhooks(users.results)
  const organizations = await storage.findOrganizations()
  await webhooks.sendOrganizationsWebhooks(organizations.results)
}

main()
