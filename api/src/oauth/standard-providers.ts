import axios from '@data-fair/lib-node/axios.js'
import config from '#config'
import Debug from 'debug'
import { type OAuthProvider, type OAuthUserInfo } from './service.ts'

const debug = Debug('oauth')

export const standardProviders: OAuthProvider[] = [{
  id: 'github',
  title: 'GitHub',
  icon: 'mdi-github',
  color: '#6e5494',
  scope: 'read:user user:email',
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize'
  },
  userInfo: async (accessToken: string) => {
    const res = await Promise.all([
      axios.get('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}` } }),
      axios.get('https://api.github.com/user/emails', { headers: { Authorization: `token ${accessToken}` } })
    ])
    debug('user info from github', res[0].data, res[1].data)
    let email = res[1].data.find((e: any) => e.primary)
    if (!email) email = res[1].data.find((e: any) => e.verified)
    if (!email) email = res[1].data[0]
    return {
      data: res[0].data,
      user: {
        name: res[0].data.name,
        avatarUrl: res[0].data.avatar_url,
        email: email.email
      },
      id: res[0].data.id,
      url: res[0].data.html_url
    }
  },
  client: config.oauth.github
}, {
  id: 'facebook',
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
  userInfo: async (accessToken: string) => {
    // TODO: fetch picture, but it is a temporary URL we should store the result if we want to use it
    const res = await axios.get('https://graph.facebook.com/me', { params: { access_token: accessToken, fields: 'name,first_name,last_name,email' } })
    debug('user info from facebook', res.data)
    const userInfo: OAuthUserInfo = {
      data: res.data,
      user: {
        name: res.data.name,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        email: res.data.email
      },
      id: res.data.id,
      url: 'https://www.facebook.com'
    }
    return userInfo
  },
  client: config.oauth.facebook
}, {
  id: 'google',
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
  userInfo: async (accessToken: string) => {
    const res = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', { params: { alt: 'json', access_token: accessToken } })
    debug('user info from google', res.data)
    return {
      data: res.data,
      user: {
        name: res.data.name,
        firstName: res.data.given_name,
        lastName: res.data.family_name,
        email: res.data.email,
        avatarUrl: res.data.picture // is this URL temporary ?
      },
      id: res.data.id,
      url: 'https://www.google.com'
    }
  },
  client: config.oauth.google
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
{
  id: 'linkedin',
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

    const userInfo: OAuthUserInfo = {
      data: res[0].data,
      user: {
        firstName: res[0].data.localizedFirstName,
        lastName: res[0].data.localizedLastName,
        email: res[1].data.elements[0]['handle~'].emailAddress
      },
      id: res[0].data.id,
      // building profile url would require the r_basicprofile authorization, but it is possible only after requesting special authorization by linkein
      url: 'https://www.linkedin.com'
    }
    userInfo.user.name = userInfo.user.firstName + ' ' + userInfo.user.lastName

    if (res[0].data.profilePicture && res[0].data.profilePicture['displayImage~']) {
      const displayImage = res[0].data.profilePicture['displayImage~'].elements
        .find((e: any) => e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'] && e.data['com.linkedin.digitalmedia.mediaartifact.StillImage'].displaySize.width === 100)
      const displayImageIdentifier = displayImage && displayImage.identifiers.find((i: any) => i.identifierType === 'EXTERNAL_URL')
      if (displayImageIdentifier) userInfo.user.avatarUrl = displayImageIdentifier.identifier // is this URL temporary ?
    }

    return userInfo
  },
  client: config.oauth.linkedin
}
]
export default standardProviders
