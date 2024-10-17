const { Gauge } = require('prom-client')

export const  init = async (db) => {
  // global metrics based on db connection
  if (db) {
    const { servicePromRegistry } = await import('@data-fair/lib/node/observer.js')

    // eslint-disable-next-line no-new
    new Gauge({
      name: 'df_sd_users_total',
      help: 'Total number of users',
      registers: [servicePromRegistry],
      async collect () {
        this.set(await db.collection('users').estimatedDocumentCount())
      }
    })

    // eslint-disable-next-line no-new
    new Gauge({
      name: 'df_sd_orgs_total',
      help: 'Total number of organizations',
      registers: [servicePromRegistry],
      async collect () {
        this.set(await db.collection('organizations').estimatedDocumentCount())
      }
    })
  }
}
