import config from '#config'
import mongo from '#mongo'
import { Gauge } from 'prom-client'
import { servicePromRegistry } from '@data-fair/lib-node/observer.js'
import dayjs from 'dayjs'

export const init = async () => {
  // global metrics based on db connection
  // eslint-disable-next-line no-new
  new Gauge({
    name: 'sd_organizations',
    help: 'Total number of users',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.users.estimatedDocumentCount())
    }
  })

  // eslint-disable-next-line no-new
  new Gauge({
    name: 'sd_users',
    help: 'Total number of organizations',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.organizations.estimatedDocumentCount())
    }
  })

  // eslint-disable-next-line no-new
  new Gauge({
    name: 'sd_logged_users_24h',
    help: 'Number of users logged duging last 24 hours',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.users.countDocuments({ logged: { $gt: dayjs().subtract(1, 'days').toDate().toISOString() } }))
    }
  })

  // this metric is optional as it can become a little heavy to process on larger installs
  if (config.observer.orgLevelMetrics) {
    // eslint-disable-next-line no-new
    new Gauge({
      name: 'sd_members',
      help: 'Number of members per organization and per role',
      labelNames: ['org', 'role'],
      registers: [servicePromRegistry],
      async collect () {
        for await (const org of mongo.organizations.find()) {
          for (const role of config.roles.defaults) {
            this.set(
              { org: org._id, role },
              await mongo.users.countDocuments({ organizations: { $elemMatch: { id: org._id, role } } })
            )
          }
        }
      }
    })
  }
}
