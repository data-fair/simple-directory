// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

const fs = require('fs-extra')
const saml2 = require('saml2-js')
const config = require('config')
const { promisify } = require('util')
const slug = require('slugify')

exports.idps = {}

exports.getProviderId = (url) => {
  return slug(new URL(url).host, { lower: true, strict: true })
}

exports.init = async () => {
  exports.sp = new saml2.ServiceProvider({
    entity_id: `${config.publicUrl}/api/auth/saml2-metadata.xml`,
    private_key: (await fs.readFile(config.secret.private)).toString(),
    certificate: (await fs.readFile(config.secret.public)).toString(),
    assert_endpoint: `${config.publicUrl}/api/auth/saml2-assert`,
    sign_get_request: false,
    allow_unencrypted_assertion: true
  })
  exports.sp.createLoginRequestURL = promisify(exports.sp.create_login_request_url).bind(exports.sp)
  exports.sp.postAssert = promisify(exports.sp.post_assert).bind(exports.sp)

  for (const providerConfig of config.saml2.providers) {
    const id = exports.getProviderId(providerConfig.loginUrl)
    if (exports.idps[id]) throw new Error('Duplicate SAML provider id ' + id)
    exports.idps[id] = new saml2.IdentityProvider({
      sso_login_url: providerConfig.loginUrl,
      sso_logout_url: providerConfig.logoutUrl,
      certificates: providerConfig.certificates,
      sign_get_request: false,
      allow_unencrypted_assertion: true
    })
  }
}

exports.publicProviders = config.saml2.providers.map(p => ({
  type: 'saml2',
  id: exports.getProviderId(p.loginUrl),
  title: p.title,
  color: p.color,
  icon: p.icon
}))
