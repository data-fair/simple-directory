// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

const fs = require('fs-extra')
const config = require('config')
const slug = require('slugify')
const samlify = require('samlify')
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
  const cert = (await fs.readFile(config.secret.public)).toString()
  const privateKey = (await fs.readFile(config.secret.private)).toString()

  const assertionConsumerService = [{
    Binding: samlify.Constants.namespace.binding.post,
    Location: `${config.publicUrl}/api/auth/saml2-assert`
  }]

  exports.sp = samlify.ServiceProvider({
    entityID: `${config.publicUrl}/api/auth/saml2-metadata.xml`,
    assertionConsumerService,
    signingCert: cert,
    privateKey,
    encryptCert: cert,
    envPrivateKey: privateKey
  })

  exports.publicProviders = []

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
      img: providerConfig.img
    })
  }
}
