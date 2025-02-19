import axios from '@data-fair/lib-node/axios.js'
import config from '#config'
import Debug from 'debug'
import { type OAuthProvider, type OAuthUserInfo } from './service.ts'

const debug = Debug('oauth')

// icons are copied from @mdi/js https://raw.githubusercontent.com/Templarian/MaterialDesign-JS/refs/heads/master/mdi.js
const standardProviders: OAuthProvider[] = []

for (const provider of config.oauth.providers) {
  if (provider === 'github') {
    standardProviders.push({
      id: 'github',
      type: 'oauth',
      title: 'GitHub',
      icon: 'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z',
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
    })
  }

  if (provider === 'facebook') {
    standardProviders.push({
      id: 'facebook',
      type: 'oauth',
      title: 'Facebook',
      icon: 'M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z',
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
    })
  }

  if (provider === 'google') {
    standardProviders.push({
      id: 'google',
      type: 'oauth',
      title: 'Google',
      icon: 'M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z',
      color: '#0F71F2',
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
    })
  }
  if (provider === 'linkedin') {
    standardProviders.push({
      id: 'linkedin',
      type: 'oauth',
      title: 'LinkedIn',
      icon: 'M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z',
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
    })
  }
/*
  Problem with instagram provider.. it does not return an email for the user
  if (provider === 'instagram') {
    standardProviders.push({
      title: 'Instagram',
      icon: 'M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z',
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
    })
  }
    */
}

export default standardProviders
