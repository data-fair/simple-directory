// useful tutorial
// https://medium.com/disney-streaming/setup-a-single-sign-on-saml-test-environment-with-docker-and-nodejs-c53fc1a984c9

import { readFile, access, constants } from 'node:fs/promises'
import type { Saml2 } from '../../config/type/index.ts'
import config from '#config'
import _slug from 'slugify'
import samlify from 'samlify'
import Debug from 'debug'
import mongo from '#mongo'
import { decipher, cipher } from '../utils/cipher.ts'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const debug = Debug('saml')
const slug = _slug.default

type Certificates = { signing: { privateKey: string, cert: string }, encrypt: { privateKey: string, cert: string } }

type PreparedSaml2Provider = Saml2 & { id: string, idp: samlify.IdentityProviderInstance }

// const validator = require('@authenio/samlify-xsd-schema-validator')
// samlify.setSchemaValidator(validator)
// TODO: apply an actual validator cf https://github.com/tngan/samlify#installation
samlify.setSchemaValidator({
  validate: (response) => {
    return Promise.resolve('skipped')
  }
})

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

const readCertificates = async (): Promise<undefined | Certificates> => {
  const secret = await mongo.secrets.findOne({ _id: 'saml-certificates' })
  if (secret) {
    const certificates = secret.data
    certificates.signing.privateKey = decipher(certificates.signing.privateKey)
    certificates.encrypt.privateKey = decipher(certificates.encrypt.privateKey)
    return certificates
  }
}

const writeCertificates = async (certificates: Certificates) => {
  const storedCertificates = { signing: { ...certificates.signing }, encrypt: { ...certificates.encrypt } } as any
  storedCertificates.signing.privateKey = cipher(certificates.signing.privateKey)
  storedCertificates.encrypt.privateKey = cipher(certificates.encrypt.privateKey)
  await mongo.secrets.insertOne({ _id: 'saml-certificates', data: storedCertificates })
}

const _globalProviders: PreparedSaml2Provider[] = []
let _sp: samlify.ServiceProviderInstance | undefined
export const saml2ServiceProvider = () => {
  if (!_sp) throw new Error('Global Saml 2 providers ware not initialized')
  return _sp
}
export const saml2GlobalProviders = () => {
  if (!_sp) throw new Error('Global Saml 2 providers ware not initialized')
  return _globalProviders
}

export const init = async () => {
  let certificates = await readCertificates()
  if (!certificates) {
    certificates = await readDeprecatedCertificates()
    if (!certificates) certificates = { signing: await createCert(), encrypt: await createCert() }
    await writeCertificates(certificates)
  }

  const assertionConsumerService = [{
    Binding: samlify.Constants.namespace.binding.post,
    Location: `${config.publicUrl}/api/auth/saml2-assert`
  }]
  debug('config service provider')
  _sp = samlify.ServiceProvider({
    entityID: `${config.publicUrl}/api/auth/saml2-metadata.xml`,
    assertionConsumerService,
    signingCert: certificates.signing.cert,
    privateKey: certificates.signing.privateKey,
    encryptCert: certificates.encrypt.cert,
    encPrivateKey: certificates.encrypt.privateKey,
    ...config.saml2.sp
  })

  debug('config identity providers')
  for (const providerConfig of config.saml2.providers) {
    const idp = samlify.IdentityProvider(providerConfig)
    if (!idp.entityMeta.meta.entityID) throw new Error('missing entityID in saml IDP metadata')
    const id = getSamlProviderId(idp.entityMeta.meta.entityID)
    _globalProviders.push({
      id,
      ...providerConfig,
      idp
    })
  }
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
