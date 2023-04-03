const oauth2 = require('simple-oauth2')
const path = require('path')
const fs = require('fs-extra')
const config = require('config')
const { nanoid } = require('nanoid')
const axios = require('axios')
const slug = require('slugify')
const debug = require('debug')('oauth')

exports.getProviderId = (url) => {
  return slug(new URL(url).host, { lower: true, strict: true })
}

const standardProviders = {
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
      debug('user info from github', res[0].data, res[1].data)
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
      // TODO: fetch picture, but it is a temporary URL we should store the result if we want to use it
      const res = await axios.get('https://graph.facebook.com/me', { params: { access_token: accessToken, fields: 'name,first_name,last_name,email' } })
      debug('user info from facebook', res.data)
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
      debug('user info from google', res.data)
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

      debug('user info from linkedin', res[0].data, res[1].data)

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
  if (!standardProviders[p]) throw new Error('Unknown oauth provider ' + p)
})

exports.providers = []

for (const p of config.oidc.providers) {
  exports.providers.push({
    ...p
  })
}
for (const p of config.oauth.providers) {
  exports.providers.push({
    ...standardProviders[p],
    id: p,
    client: config.oauth[p],
    auth: standardProviders[p].auth
  })
}

const statesDir = path.resolve(__dirname, '../..', config.oauth.statesDir)

exports.initProvider = async (p) => {
  // persence of p.discovery means we are on an OIDC provider
  if (p.discovery) {
    p.id = this.getProviderId(p.discovery)
    p.scope = 'openid email profile'
    p.oidc = true
    const discoveryContentPath = path.join(statesDir, 'oidc-discovery-' + p.id)
    let discoveryContent
    if (await fs.pathExists(discoveryContentPath)) {
      // TODO: refetch once in a while ? is there a rule of thumb for this ?
      discoveryContent = await fs.readJson(discoveryContentPath, 'utf8')
    } else {
      discoveryContent = (await axios.get(p.discovery)).data
      await fs.writeJson(discoveryContentPath, discoveryContent, { spaces: 2 })
    }
    const tokenURL = new URL(discoveryContent.token_endpoint)
    const authURL = new URL(discoveryContent.authorization_endpoint)
    p.auth = {
      tokenHost: tokenURL.origin,
      tokenPath: tokenURL.pathname,
      authorizeHost: authURL.origin,
      authorizePath: authURL.pathname
    }
    p.userInfo = async (accessToken) => {
      const claims = (await axios.get(discoveryContent.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })).data
      if (claims.email_verified === false) throw new Error('OAuth athentication invalid, email_verified is false.')
      return { email: claims.email, avatarUrl: claims.picture, name: claims.name }
    }
  }
  const oauthClient = oauth2.create({
    client: p.client,
    auth: p.auth
  })

  // a random string as state for each provider
  const statePath = path.join(statesDir, 'oauth-state-' + p.id)
  if (await fs.pathExists(statePath)) {
    p.state = await fs.readFile(statePath, 'utf8')
  } else {
    p.state = nanoid()
    await fs.writeFile(statePath, p.state)
  }

  // standard oauth providers use the old deprecated url callback for retro-compatibility
  const callbackUri = p.discovery ? `${config.publicUrl}/api/auth/oauth-callback` : `${config.publicUrl}/api/auth/oauth/${p.id}/callback`

  // dynamically prepare authorization uris for login redirection
  p.authorizationUri = (relayState, email) => {
    const params = {
      redirect_uri: callbackUri,
      scope: p.scope,
      state: JSON.stringify(relayState),
      display: 'page',
      prompt: 'login'
    }
    if (email) {
      // send email in login_hint
      // see https://openid.net/specs/openid-connect-basic-1_0.html
      params.login_hint = email
    }
    const url = oauthClient.authorizationCode.authorizeURL(params)
    return url
  }

  // get an access token from code sent as callback to login redirect
  p.accessToken = async (code) => {
    const token = await oauthClient.authorizationCode.getToken({
      code,
      redirect_uri: callbackUri,
      scope: p.scope,
      client_id: p.client.id,
      client_secret: p.client.secret,
      grant_type: 'authorization_code'
    })
    if (token.error) {
      console.error('Bad OAuth code', token)
      throw new Error('Bad OAuth code')
    }
    return token.access_token
  }

  return p
}

exports.init = async () => {
  await fs.ensureDir(statesDir)

  for (const p of exports.providers) {
    await this.initProvider(p)
  }

  exports.publicProviders = exports.providers.map(p => ({
    type: 'oauth',
    id: p.id,
    title: p.title,
    color: p.color,
    icon: p.icon,
    img: p.img
  }))
}
