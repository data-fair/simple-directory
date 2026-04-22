// Regression coverage for the C-2 follow-up: api/src/saml2/service.ts#createCert
// was rewritten from
//   exec(`echo "${privateKey}" | openssl req -key /dev/stdin ... -subj "${subject}"`)
// — a shell pipeline with string interpolation and a stdin race — to
// crypto.generateKeyPairSync + execFile('openssl', [...]) (no shell, argv array).
//
// In production the path runs once per (deployment, site) and the result is cached
// in mongo's `secrets` collection forever, so the live dev env will normally NOT
// exercise it after the first restart. This test calls createCert directly so any
// regression (wrong PEM shape, broken openssl invocation, cert without the right
// CN) fails CI even when the dev env is happily reading cached certs.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { createPrivateKey, X509Certificate } from 'node:crypto'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

test.describe('SAML2 createCert (C-2 follow-up)', () => {
  let createCert: () => Promise<{ privateKey: string, cert: string }>
  let expectedHostname: string

  test.beforeAll(async () => {
    const samlService = await import('../../api/src/saml2/service.ts')
    createCert = samlService.createCert
    const config = (await import('../../api/src/config.ts')).default
    expectedHostname = new URL(config.publicUrl).hostname
  })

  test('produces a PKCS#8 RSA private key parseable by node:crypto', async () => {
    const { privateKey } = await createCert()
    assert.match(privateKey, /^-----BEGIN PRIVATE KEY-----/)
    assert.match(privateKey, /-----END PRIVATE KEY-----\s*$/)
    const key = createPrivateKey(privateKey)
    assert.equal(key.asymmetricKeyType, 'rsa')
    // 2048-bit modulus per the explicit modulusLength in createCert
    assert.equal(key.asymmetricKeyDetails?.modulusLength, 2048)
  })

  test('produces a self-signed X.509 cert with the configured publicUrl hostname as CN', async () => {
    const { cert } = await createCert()
    assert.match(cert, /^-----BEGIN CERTIFICATE-----/)
    assert.match(cert, /-----END CERTIFICATE-----\s*$/)
    const x509 = new X509Certificate(cert)
    // openssl emits the subject as 'C=FR, CN=<hostname>' (or with newlines depending on version)
    assert.ok(
      x509.subject.includes(`CN=${expectedHostname}`),
      `cert subject ${JSON.stringify(x509.subject)} does not contain CN=${expectedHostname}`
    )
    // self-signed: issuer matches subject
    assert.equal(x509.issuer, x509.subject)
    // validity window: 3 years (1095 days) per the -days arg in createCert
    const validFrom = new Date(x509.validFrom).getTime()
    const validTo = new Date(x509.validTo).getTime()
    const days = (validTo - validFrom) / (1000 * 60 * 60 * 24)
    assert.ok(Math.abs(days - 1095) < 1, `expected ~1095-day validity window, got ${days}`)
  })

  test('cert and key form a matching keypair (cert public key verifies against private key signature shape)', async () => {
    const { privateKey, cert } = await createCert()
    const x509 = new X509Certificate(cert)
    const keyObj = createPrivateKey(privateKey)
    // Both should expose the same public modulus length
    assert.equal(keyObj.asymmetricKeyDetails?.modulusLength, 2048)
    assert.equal(x509.publicKey.asymmetricKeyDetails?.modulusLength, 2048)
    // X509Certificate.checkPrivateKey is the canonical "do these belong together" check
    assert.ok(x509.checkPrivateKey(keyObj), 'cert public key does not match the generated private key')
  })
})
