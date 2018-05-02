const conf = require('config').storage

module.exports.init = async () => require('./' + conf.type)(conf[conf.type])
