const config = require('config')

module.exports.init = async function() {
  const storage = require('./' + config.storage.type)
  const configuredStorage = await storage(config.storage.params)
  return configuredStorage
}
