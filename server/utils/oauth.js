const oauth2 = require('simple-oauth2')
const path = require('path')
const fs = require('fs-extra')
const config = require('config')
const shortid = require('shortid')
const axios = require('axios')

const providers = {
  github: {
    title: 'GitHub',
    icon: 'mdi-github',
    color: '#6e5494',
    scope: 'read:user',
    auth: {
      tokenHost: 'https://github.com',
      tokenPath: '/login/oauth/access_token',
      authorizePath: '/login/oauth/authorize'
    },
    userInfo: async (accessToken) => {
      const res = await axios.get('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}` } })
      return {
        login: res.data.login,
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        url: res.data.html_url,
        avatarUrl: res.data.avatar_url
      }
    }
  }
}

config.oauth.providers.forEach(p => {
  if (!providers[p]) throw new Error('Unknown oauth provider ' + p)
})

exports.providers = config.oauth.providers.map(p => ({
  ...providers[p],
  id: p,
  client: oauth2.create({ client: config.oauth[p], auth: providers[p].auth })
}))

const statesDir = path.resolve(__dirname, '../..', config.oauth.statesDir)
fs.ensureDir(statesDir)

exports.providers.forEach(p => {
  // a random string as state for each provider
  const statePath = path.join(statesDir, 'oauth-state-' + p.id)
  let state
  if (fs.existsSync(statePath)) {
    state = fs.readFileSync(statePath, 'utf8')
  } else {
    state = shortid.generate()
    fs.writeFileSync(statePath, state)
  }

  const callbackUri = `${config.publicUrl}/api/auth/oauth/${p.id}/callback`

  // prepare al authorization uris for login redirection
  p.authorizationUri = p.client.authorizationCode.authorizeURL({
    redirect_uri: callbackUri,
    scope: p.scope,
    state
  })

  // get an access token from code sent as callback to login redirect
  p.accessToken = async (code) => {
    const token = await p.client.authorizationCode.getToken({
      code,
      redirect_uri: callbackUri,
      scope: p.code
    })
    if (token.error) {
      console.error('Bad OAuth code', token)
      throw new Error('Bad OAuth code')
    }
    return token.access_token
  }
})

exports.publicProviders = exports.providers.map(p => ({ id: p.id, title: p.title, color: p.color, icon: p.icon }))
