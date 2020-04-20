const oauth2 = require('simple-oauth2')
const path = require('path')
const fs = require('fs-extra')
const config = require('config')
const shortid = require('shortid')
const axios = require('axios')
const debug = require('debug')('oauth')

const providers = {
  github: {
    title: 'GitHub',
    icon: 'mdi-github',
    color: '#6e5494',
    scope: 'read:user user:email',
    auth: {
      tokenHost: 'https://github.com',
      tokenPath: '/login/oauth/access_token',
      authorizePath: '/login/oauth/authorize'
    },
    userInfo: async (accessToken) => {
      const res = await Promise.all([
        axios.get('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}` } }),
        axios.get('https://api.github.com/user/emails', { headers: { Authorization: `token ${accessToken}` } })
      ])
      debug(`user info from github`, res[0].data, res[1].data)
      const userInfo = {
        login: res[0].data.login,
        id: res[0].data.id,
        name: res[0].data.name,
        url: res[0].data.html_url,
        avatarUrl: res[0].data.avatar_url
      }
      let email = res[1].data.find(e => e.primary)
      if (!email) email = res[1].data.find(e => e.verified)
      if (!email) email = res[1].data[0]
      if (email) userInfo.email = email.email
      return userInfo
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
      // TOFO: fetch picture, but it is a temporary URL we should store the result if we want to use it
      const res = await axios.get('https://graph.facebook.com/me', { params: { access_token: accessToken, fields: 'name,first_name,last_name,email' } })
      debug(`user info from facebook`, res.data)
      return {
        id: res.data.id,
        name: res.data.name,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        email: res.data.email,
        url: 'https://www.facebook.com'
      }
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
      debug(`user info from google`, res.data)
      return {
        id: res.data.id,
        name: res.data.name,
        firstName: res.data.given_name,
        lastName: res.data.family_name,
        email: res.data.email,
        avatarUrl: res.data.picture, // is this URL temporary ?
        url: 'https://www.google.com'
      }
    }
  },
  /*
  Problem with instagram provider.. it does not return an email for the user
  instagram: {
    title: 'Instagram',
    icon: 'mdi-instagram',
    color: '#e1306c',
    scope: 'basic',
    auth: {
      tokenHost: 'https://api.instagram.com',
      tokenPath: '/oauth/access_token',
      authorizePath: '/oauth/authorize'
    },
    userInfo: async (accessToken) => {
      const res = await axios.get('https://api.instagram.com/users/self', { params: { access_token: accessToken } })
      return {
        login: res.data.username,
        id: res.data.id,
        name: res.data.full_name,
        avatarUrl: res.data.profile_picture, // is this URL temporary ?
        url: 'https://www.instagram.com'
      }
    }
  } */
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
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get('https://api.linkedin.com/v2/clientAwareMemberHandles', {
          params: {
            q: 'members',
            projection: '(elements*(primary,type,handle~))'
          },
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ])

      debug(`user info from linkedin`, res[0].data, res[1].data)

      const userInfo = {
        id: res[0].data.id,
        firstName: res[0].data.localizedFirstName,
        lastName: res[0].data.localizedLastName,
        email: res[1].data.elements[0]['handle~'].emailAddress,
        // building profile url would require the r_basicprofile authorization, but it is possible only after requesting special authorization by linkein
        url: 'https://www.linkedin.com'
      }
      userInfo.name = userInfo.firstName + ' ' + userInfo.lastName

      if (res[0].data.profilePicture && res[0].data.profilePicture['displayImage~']) {
        const displayImage = res[0].data.profilePicture['displayImage~'].elements
          .find(e => e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'] && e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize.width === 100)
        const displayImageIdentifier = displayImage && displayImage.identifiers.find(i => i.identifierType === 'EXTERNAL_URL')
        if (displayImageIdentifier) userInfo.avatarUrl = displayImageIdentifier.identifier // is this URL temporary ?
      }

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
