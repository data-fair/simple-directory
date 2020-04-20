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
  },
  facebook: {
    title: 'Facebook',
    icon: 'mdi-facebook',
    color: '#3b5998',
    scope: 'email',
    auth: {
      tokenHost: 'https://graph.facebook.com',
      tokenPath: '/v6.0/oauth/access_token',
      authorizeHost: 'https://www.facebook.com',
      authorizePath: '/v6.0/dialog/oauth'
    },
    userInfo: async (accessToken) => {
      const res = await axios.get('https://graph.facebook.com/me', { params: { access_token: accessToken } })
      console.log('FACEBOOK RES', res.data)
    }
  },
  google: {
    title: 'Google',
    icon: 'mdi-google',
    color: '#0F9D58',
    scope: 'profile email',
    auth: {
      tokenHost: 'https://www.googleapis.com',
      tokenPath: '/oauth2/v4/token',
      authorizeHost: 'https://accounts.google.com',
      authorizePath: '/o/oauth2/v2/auth'
    },
    userInfo: async (accessToken) => {
      const res = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', { params: { alt: 'json', access_token: accessToken } })
      console.log('GOOGLE RES', res.data)
    }
  },
  linkedin: {
    title: 'LinkedIn',
    icon: 'mdi-linkedin',
    color: '#016097',
    scope: 'r_liteprofile r_emailaddress',
    auth: {
      tokenHost: 'https://www.linkedin.com',
      tokenPath: '/oauth/v2/accessToken',
      authorizePath: '/oauth/v2/authorization'
    },
    userInfo: async (accessToken) => {
      const res = await Promise.all([
        axios.get('https://api.linkedin.com/v2/me', {
          params: {
            projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))'
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }),
        axios.get('https://api.linkedin.com/v2/clientAwareMemberHandles', {
          params: {
            q: 'members',
            projection: '(elements*(primary,type,handle~))'
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      ])

      const userInfo = {
        id: res[0].data.id,
        firstName: res[0].data.localizedFirstName,
        lastName: res[0].data.localizedLastName,
        email: res[1].data.elements[0]['handle~'].emailAddress,
        // building profile url would require the r_basicprofile authorization, but it is possible only after requesting special authorization by linkein
        url: 'https://www.linkedin.com'
      }
      userInfo.name = userInfo.firstName + ' ' + userInfo.lastName

      const displayImage = res[0].data.profilePicture['displayImage~'].elements
        .find(e => e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'] && e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize.width === 100)
      const displayImageIdentifier = displayImage && displayImage.identifiers.find(i => i.identifierType === 'EXTERNAL_URL')
      if (displayImageIdentifier) userInfo.avatarUrl = displayImageIdentifier.identifier

      return userInfo
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
      scope: p.scope,
      client_id: config.oauth[p.id].id,
      client_secret: config.oauth[p.id].secret
    })
    if (token.error) {
      console.error('Bad OAuth code', token)
      throw new Error('Bad OAuth code')
    }
    return token.access_token
  }
})

exports.publicProviders = exports.providers.map(p => ({ id: p.id, title: p.title, color: p.color, icon: p.icon }))
