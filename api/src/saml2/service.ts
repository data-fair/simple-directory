// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

import type { Request } from 'express'
import { readFile, access, constants } from 'node:fs/promises'
import type { SAML2 } from '../../config/type/index.ts'
import config from '#config'
import _slug from 'slugify'
import samlify from 'samlify'
import Debug from 'debug'
import mongo from '#mongo'
import { decipher, cipher } from '../utils/cipher.ts'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { getSiteBaseUrl, reqSite } from '#services'
import { type Site } from '#types'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'

const execAsync = promisify(exec)
const debug = Debug('saml')
const slug = _slug.default

type Certificates = { signing: { privateKey: string, cert: string }, encrypt: { privateKey: string, cert: string } }

export type PreparedSaml2Provider = SAML2 & { id: string, type: 'saml2', idp: samlify.IdentityProviderInstance }

export type Saml2RelayState = [string, string, string, string, string, string, string]

// const validator = require('@authenio/samlify-xsd-schema-validator')
// samlify.setSchemaValidator(validator)
// TODO: apply an actual validator cf https://github.com/tngan/samlify#installation
samlify.setSchemaValidator({
  validate: (response) => {
    return Promise.resolve('skipped')
  }
})

export const getSamlProviderById = async (req: Request, id: string): Promise<PreparedSaml2Provider | undefined> => {
  const site = await reqSite(req)
  if (!site) {
    return saml2GlobalProviders().find(p => p.id === id)
  } else {
    const providerInfo = site.authProviders?.find(p => p.type === 'saml2' && getSamlConfigId(p) === id) as SAML2 | undefined
    if (!providerInfo) return undefined
    const idp = samlify.IdentityProvider(providerInfo)
    return {
      id,
      type: 'saml2',
      ...providerInfo,
      idp
    }
  }
}

export const getSamlConfigId = (providerConfig: SAML2) => {
  const idp = samlify.IdentityProvider(providerConfig)
  if (!idp.entityMeta.meta.entityID) throw new Error('missing entityID in saml IDP metadata')
  return getSamlProviderId(idp.entityMeta.meta.entityID)
}

export const getSamlProviderId = (url: string) => {
  return slug(new URL(url).host, { lower: true, strict: true })
}

const readDeprecatedCertificates = async (): Promise<undefined | Certificates> => {
  try {
    await access('/webapp/security/saml2/signing.key', constants.R_OK)
    await access('/webapp/security/saml2/signing.crt', constants.R_OK)
    await access('/webapp/security/saml2/encrypt.key', constants.R_OK)
    await access('/webapp/security/saml2/encrypt.crt', constants.R_OK)
  } catch (err) {
    // TODO: remove this log after a few months
    console.log('No deprecated saml certificates found, this message is expected on a new deployment', err)
    return undefined
  }
  return {
    signing: {
      privateKey: await readFile('/webapp/security/saml2/signing.key', 'utf8'),
      cert: await readFile('/webapp/security/saml2/signing.crt', 'utf8')
    },
    encrypt: {
      privateKey: await readFile('/webapp/security/saml2/encrypt.key', 'utf8'),
      cert: await readFile('/webapp/security/saml2/encrypt.crt', 'utf8')
    }
  }
}

const getSiteCertKey = (site?: Site) => {
  if (!site) return 'saml-certificates'
  let key = 'saml-certificates-' + slug(site.host)
  if (site.path) key += `--${slug(site.path)}`
  return key
}

const readCertificates = async (site?: Site): Promise<undefined | Certificates> => {
  const key = getSiteCertKey(site)
  const secret = await mongo.secrets.findOne({ _id: key })
  if (secret) {
    const certificates = secret.data
    certificates.signing.privateKey = decipher(certificates.signing.privateKey)
    certificates.encrypt.privateKey = decipher(certificates.encrypt.privateKey)
    return certificates
  }
}

const writeCertificates = async (certificates: Certificates, site?: Site) => {
  const key = getSiteCertKey(site)
  const storedCertificates = { signing: { ...certificates.signing }, encrypt: { ...certificates.encrypt } } as any
  storedCertificates.signing.privateKey = cipher(certificates.signing.privateKey)
  storedCertificates.encrypt.privateKey = cipher(certificates.encrypt.privateKey)
  await mongo.secrets.insertOne({ _id: key, data: storedCertificates })
}

const _globalProviders: PreparedSaml2Provider[] = []
let _sp: samlify.ServiceProviderInstance | undefined
export const saml2ServiceProvider = async (site?: Site) => {
  if (!_sp) throw new Error('Global Saml 2 provider was not initialized')
  if (site) return await initServiceProvider(site)
  return _sp
}
export const saml2GlobalProviders = () => {
  if (!_sp) throw new Error('Global Saml 2 provider was not initialized')
  return _globalProviders
}

const initCertificates = async (site?: Site) => {
  let certificates = await readCertificates(site)
  if (!certificates) {
    console.log('Initializing SAML certificates')
    if (!site) {
      certificates = await readDeprecatedCertificates()
      if (certificates) {
        console.log('Migrating SAML certificates from filesystem to database')
      }
    }
    if (!certificates) {
      console.log('Generating new SAML certificates')
      certificates = { signing: await createCert(), encrypt: await createCert() }
    }
    await writeCertificates(certificates, site)
  }
  return certificates
}

export const init = async () => {
  _sp = await initServiceProvider()

  debug('config identity providers')
  for (const providerConfig of config.saml2.providers) {
    const idp = samlify.IdentityProvider(providerConfig)
    if (!idp.entityMeta.meta.entityID) throw new Error('missing entityID in saml IDP metadata')
    const id = getSamlProviderId(idp.entityMeta.meta.entityID)
    _globalProviders.push({
      id,
      type: 'saml2',
      ...providerConfig,
      idp
    })
  }
}

export const initServiceProvider = async (site?: Site) => {
  const certificates = await initCertificates(site)
  const url = site ? `${getSiteBaseUrl(site)}/simple-directory` : config.publicUrl
  const assertionConsumerService = [{
    Binding: samlify.Constants.namespace.binding.post,
    Location: `${url}/api/auth/saml2-assert`
  }]
  debug('config service provider')
  return samlify.ServiceProvider({
    entityID: `${url}/api/auth/saml2-metadata.xml`,
    assertionConsumerService,
    signingCert: certificates.signing.cert,
    privateKey: certificates.signing.privateKey,
    encryptCert: certificates.encrypt.cert,
    encPrivateKey: certificates.encrypt.privateKey,
    // @ts-ignore if we use a boolean the attribute is set as empty in the xml output, and some IDP don't like that
    allowCreate: 'false',
    ...config.saml2.sp
  })
}

const createCert = async () => {
  const subject = `/C=FR/CN=${new URL(config.publicUrl).hostname}`
  const privateKey = (await execAsync('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048')).stdout
  const certPromise = execAsync(`echo "${privateKey}" | openssl req -key /dev/stdin -x509 -sha256 -nodes -days 1095 -subj "${subject}"`)
  certPromise.child.stdin?.write(privateKey)
  certPromise.child.stdin?.end()
  const cert = (await certPromise).stdout
  return { privateKey, cert }
}

// attributes for microsoft entra https://learn.microsoft.com/en-us/entra/identity-platform/reference-saml-tokens
// oid keys https://ldap.com/ldap-oid-reference-guide/
const emailKeys = [
  'email',
  'emailAddress', 'emailaddress', 'email_address',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  'urn:oid:0.9.2342.19200300.100.1.3'
]
const firstNameKeys = [
  'firstName', 'firstname', 'first_name',
  'givenName', 'givenname', 'given_name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  'urn:oid:2.5.4.42'
]
const lastNameKeys = [
  'lastName', 'lastname', 'last_name',
  'surName', 'surname', 'sn',
  'familyName', 'familyname', 'family_name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
  'urn:oid:2.5.4.4'
]

export const getUserAttrs = (attrs: any, logContext: EventLogContext) => {
  const emailKey = emailKeys.find(k => attrs[k])
  const firstNameKey = firstNameKeys.find(k => attrs[k])
  const lastNameKey = lastNameKeys.find(k => attrs[k])
  const email = emailKey && attrs[emailKey] as string
  if (!email) {
    console.error('Email attribute not fetched from SAML', attrs)
    eventsLog.info('sd.auth.saml.fail', 'a user failed to authenticate with saml due to missing email', logContext)
    throw new Error('Email attribute not fetched from SAML')
  }
  return {
    email,
    firstName: firstNameKey && attrs[firstNameKey] as string,
    lastName: lastNameKey && attrs[lastNameKey] as string
  }
}
