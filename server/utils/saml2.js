// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

const fs = require('fs-extra')
const saml2 = require('saml2-js')
const config = require('config')

exports.idps = {}
exports.idpsByOrigin = {}

exports.init = async () => {
  exports.sp = new saml2.ServiceProvider({
    entity_id: `${config.publicUrl}/api/auth/saml2-metadata.xml`,
    // entity_id: config.publicUrl,
    private_key: (await fs.readFile(config.secret.private)).toString(),
    certificate: (await fs.readFile(config.secret.public)).toString(),
    assert_endpoint: `${config.publicUrl}/api/auth/saml2-assert`,
    sign_get_request: false,
    allow_unencrypted_assertion: true
  })

  for (const providerConfig of config.saml2.providers) {
    exports.idps[providerConfig.id] = new saml2.IdentityProvider({
      sso_login_url: providerConfig.loginUrl,
      sso_logout_url: providerConfig.logoutUrl,
      certificates: providerConfig.certificates,
      sign_get_request: false,
      allow_unencrypted_assertion: true
    })
    const origin = new URL(providerConfig.loginUrl).origin
    if (exports.idpsByOrigin[origin]) throw new Error('It is not supported to define multiple IDPs with same origin ' + origin)
    exports.idpsByOrigin[origin] = exports.idps[providerConfig.id]
  }
}

exports.publicProviders = config.saml2.providers.map(p => ({
  type: 'saml2',
  id: p.id,
  title: p.title,
  color: p.color,
  icon: p.icon
}))
