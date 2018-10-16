const conf = require('config').storage

exports.init = async () => {
  const factory = require('./' + conf.type)
  const storage = factory.init(conf[conf.type])
  storage.readonly = factory.readonly
  return storage
}

exports.readonly = () => require('./' + conf.type).readonly
