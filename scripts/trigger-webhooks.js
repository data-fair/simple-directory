const webhooks = require('../server/webhooks')
const storages = require('../server/storages')

async function main() {
  const storage = await storages.init()
  const users = await storage.findUsers({ skip: 0, size: 100000 })
  for (const user of users.results) {
    await webhooks.postIdentity('user', user)
  }

  const organizations = await storage.findOrganizations({ skip: 0, size: 100000 })
  for (const organization of organizations.results) {
    await webhooks.postIdentity('organization', organization)
  }
}

main()
