// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

const fs = require('fs-extra')
import config from '#config'
const slug = require('slugify')
const samlify = require('samlify')
const util = require('util')
const { exec } = require('child_process')
const execAsync = util.promisify(exec)
const debug = require('debug')('saml')
// const validator = require('@authenio/samlify-xsd-schema-validator')
// samlify.setSchemaValidator(validator)

// TODO: apply an actual validator cf https://github.com/tngan/samlify#installation
samlify.setSchemaValidator({
  validate: (response) => {
    return Promise.resolve('skipped')
  }
})

exports.idps = {}

exports.getProviderId = (url) => {
  return slug(new URL(url).host, { lower: true, strict: true })
}

exports.init = async () => {
  // prepare certificates and their private keys
  await fs.ensureDir(config.saml2.certsDirectory)
  for (const name of ['signing', 'encrypt']) {
    const privateKeyPath = config.saml2.certsDirectory + '/' + name + '.key'
    try {
      await fs.access(privateKeyPath, fs.constants.F_OK)
    } catch (err) {
      const subject = `/C=FR/CN=${new URL(config.publicUrl).hostname}`
      const opensslCmd = `openssl req -x509 -sha256 -nodes -days 1095 -newkey rsa:2048 -subj "${subject}" -keyout ${privateKeyPath} -out ${config.saml2.certsDirectory + '/' + name + '.crt'}`
      debug('generate certificate with command: ' + opensslCmd)
      await execAsync(opensslCmd)
    }
  }

  const assertionConsumerService = [{
    Binding: samlify.Constants.namespace.binding.post,
    Location: `${config.publicUrl}/api/auth/saml2-assert`
  }]
  debug('config service provider')
  exports.sp = samlify.ServiceProvider({
    entityID: `${config.publicUrl}/api/auth/saml2-metadata.xml`,
    assertionConsumerService,
    signingCert: (await fs.readFile(config.saml2.certsDirectory + '/signing.crt')).toString(),
    privateKey: (await fs.readFile(config.saml2.certsDirectory + '/signing.key')).toString(),
    encryptCert: (await fs.readFile(config.saml2.certsDirectory + '/encrypt.crt')).toString(),
    encPrivateKey: (await fs.readFile(config.saml2.certsDirectory + '/encrypt.key')).toString(),
    ...config.saml2.sp
  })

  exports.publicProviders = []

  debug('config identity providers')
  for (const providerConfig of config.saml2.providers) {
    const idp = new samlify.IdentityProvider(providerConfig)
    if (!idp.entityMeta.meta.entityID) throw new Error('missing entityID in saml IDP metadata')
    const id = exports.getProviderId(idp.entityMeta.meta.entityID)
    if (exports.idps[id]) throw new Error('Duplicate SAML provider id ' + id)
    exports.idps[id] = idp
    exports.publicProviders.push({
      type: 'saml2',
      id,
      title: providerConfig.title,
      color: providerConfig.color,
      icon: providerConfig.icon,
      img: providerConfig.img,
      redirectMode: providerConfig.redirectMode
    })
  }
}
