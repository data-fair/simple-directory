import mongo from '#mongo'
import { Gauge } from 'prom-client'
import { servicePromRegistry } from '@data-fair/lib-node/observer.js'

export const init = async () => {
  // global metrics based on db connection
  // eslint-disable-next-line no-new
  new Gauge({
    name: 'df_sd_users_total',
    help: 'Total number of users',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.users.estimatedDocumentCount())
    }
  })

  // eslint-disable-next-line no-new
  new Gauge({
    name: 'df_sd_orgs_total',
    help: 'Total number of organizations',
    registers: [servicePromRegistry],
    async collect () {
      this.set(await mongo.organizations.estimatedDocumentCount())
    }
  })
}
