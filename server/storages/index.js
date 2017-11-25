const config = require('config')

module.exports.init = async function() {
  const storage = require('./' + config.storage.type)
  return await storage(config.storage.params)
}
