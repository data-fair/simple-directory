// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

import type { Request } from 'express'
import { readFile, access, constants } from 'node:fs/promises'
import type { SAML2 } from '../../config/type/index.ts'
import config from '#config'
import _slug from 'slugify'
import samlify from 'samlify'
// @ts-ignore -- no ambient types; see node_modules/@authenio/samlify-node-xmllint/build/index.d.ts
import * as xsdValidator from '@authenio/samlify-node-xmllint'
import Debug from 'debug'
import mongo from '#mongo'
import { decipher, cipher } from '../utils/cipher.ts'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getSiteBaseUrl, reqSite } from '#services'
import { type Site } from '#types'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'

const execFileAsync = promisify(execFile)
const debug = Debug('saml')
const slug = _slug.default

type Certificates = { signing: { privateKey: string, cert: string }, encrypt: { privateKey: string, cert: string } }

export type PreparedSaml2Provider = SAML2 & { id: string, type: 'saml2', idp: samlify.IdentityProviderInstance }

export type Saml2RelayState = {
  _id: string,
  createdAt: Date,
  providerId: string,
  redirect: string,
  org?: string,
  dep?: string,
  invitToken?: string,
  adminMode?: boolean
}

// Schema validation is REQUIRED — samlify relies on it to mitigate XML signature-wrapping
// attacks (e.g. CVE-2025-47949, CVE-2024-45231 / -45239). Do not replace with a pass-through
// shim under any circumstances: a `validate: () => Promise.resolve('skipped')` reintroduces
// every known samlify assertion-injection CVE. See security review C-2.
samlify.setSchemaValidator(xsdValidator)

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

// For test-env DELETE / cleanup: drop the cached SAML cert from mongo, reset the in-memory
// SP singleton, and re-run init so the next request mints a fresh cert via createCert.
// Without this, dev/CI cycles reuse whatever cert was minted at first server startup and
// the createCert path stays untested in the live env even after code changes. Site-level
// certs share the `saml-certificates*` _id prefix so they're cleaned up too.
export const resetForTests = async () => {
  await mongo.saml2RelayStates.deleteMany({})
  await mongo.secrets.deleteMany({ _id: { $regex: /^saml-certificates/ } })
  _sp = undefined
  _globalProviders.length = 0
  await init()
}

export const initServiceProvider = async (site?: Site) => {
  const certificates = await initCertificates(site)
  const url = site ? `${getSiteBaseUrl(site)}/simple-directory` : config.publicUrl
  const assertionConsumerService = [{
    Binding: samlify.Constants.namespace.binding.post,
    Location: `${url}/api/auth/saml2-assert`
  }]
  debug('config service provider')
  // config.saml2.sp is spread FIRST so it can only tune tangential options (NameIDFormat,
  // signing algorithm hints, etc.) — it cannot override our cert material, entityID,
  // assertionConsumerService, or flip wantAssertionsSigned off. Order matters (see C-2).
  return samlify.ServiceProvider({
    ...config.saml2.sp,
    entityID: `${url}/api/auth/saml2-metadata.xml`,
    assertionConsumerService,
    signingCert: certificates.signing.cert,
    privateKey: certificates.signing.privateKey,
    encryptCert: certificates.encrypt.cert,
    encPrivateKey: certificates.encrypt.privateKey,
    wantAssertionsSigned: true,
    // @ts-ignore if we use a boolean the attribute is set as empty in the xml output, and some IDP don't like that
    allowCreate: 'false'
  })
}

// Exported for the C-2 regression test in tests/features/saml2-create-cert.unit.spec.ts —
// the live dev env almost always reads a cached cert from the `secrets` collection, so
// without a direct call this path would be entirely untested.
export const createCert = async () => {
  const hostname = new URL(config.publicUrl).hostname
  // Reject hostnames that would be parsed as shell metacharacters by openssl's -subj
  // arg or that contain CR/LF (defense-in-depth; execFile already prevents shell parsing).
  if (!/^[A-Za-z0-9.\-_:[\]]+$/.test(hostname)) {
    throw new Error(`refusing to mint SAML certificate for suspicious hostname: ${hostname}`)
  }
  const subject = `/C=FR/CN=${hostname}`
  // Generate the RSA key in-process (no shell, no string interpolation, no stdin race).
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  })
  // OpenSSL 3.x's STORE subsystem refuses to read `-key /dev/stdin` from a Node-spawned
  // pipe (fopen() on a non-seekable fd fails). Stage the key in a 0700 temp directory
  // so it's owner-only readable for the brief openssl invocation, then unlink in finally.
  const tmpDir = mkdtempSync(join(tmpdir(), 'sd-saml-'))
  const keyPath = join(tmpDir, 'key.pem')
  try {
    writeFileSync(keyPath, privateKey, { mode: 0o600 })
    // execFile with argv array — `subject` and `keyPath` never reach a shell.
    const { stdout: cert } = await execFileAsync('openssl', [
      'req', '-key', keyPath, '-x509', '-sha256', '-nodes', '-days', '1095', '-subj', subject
    ])
    return { privateKey, cert }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
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
