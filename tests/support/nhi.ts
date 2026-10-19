import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { directoryUrl } from './axios.ts'

// a key pair standing for the external provider an NHI is bound to (e.g. a k8s cluster)
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
export const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }
export const jwks = { keys: [publicJwk] }
export const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' }) as string
export const issuer = 'https://test-issuer.example.com'
export const subject = 'system:serviceaccount:agents:my-agent'

// expected audience is the site origin, i.e. directoryUrl without the /simple-directory suffix
export const audience = directoryUrl.replace('/simple-directory', '')

export const signAssertion = (claims: Record<string, any> = {}, opts: jwt.SignOptions = {}) =>
  jwt.sign({ iss: issuer, sub: subject, aud: audience, ...claims }, privatePem,
    { algorithm: 'RS256', keyid: 'test-key', expiresIn: '10m', ...opts })

export const nhiBody = (overrides: Record<string, any> = {}) => ({
  name: 'My agent', role: 'user', subject, provider: { issuer, jwks }, ...overrides
})
