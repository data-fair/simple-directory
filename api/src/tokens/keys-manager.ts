import config from '#config'
import mongo from '#mongo'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { readFile, access, constants } from 'node:fs/promises'
import memoize from 'memoizee'
import JSONWebKey from 'json-web-key'
import { nanoid } from 'nanoid'

type WebKey = { alg: 'RS256', kid: string, use: 'sig' }
type SignatureKeys = { privateKey: string, publicKey: string, webKeys: [WebKey, WebKey?] }

const execAsync = promisify(exec)

export const init = async () => {
  const existingKeys = await readSignatureKeys()
  if (existingKeys) return

  // manage transition with old FS based persistence of keys
  const existingFSKeys = await readDeprecatedSignatureKeys()
  if (existingFSKeys) {
    const signatureKeys: SignatureKeys = { ...existingFSKeys, webKeys: [createWekKey(existingFSKeys.publicKey)] }
    await mongo.secrets.insertOne({ _id: 'signatureKeys', data: signatureKeys })
    return
  }

  const newKeys = await createKeys()
  const signatureKeys: SignatureKeys = { ...newKeys, webKeys: [createWekKey(newKeys.publicKey)] }
  await mongo.secrets.insertOne({ _id: 'signatureKeys', data: signatureKeys })
}

export const getSignatureKeys = memoize(async () => {
  const signatureKeys = await readSignatureKeys()
  if (!signatureKeys) throw new Error('signature keys were not initialized')
  // TODO, call rotateKeys if current key is too old
  return signatureKeys
}, { promise: true, maxAge: 10000 })

const readSignatureKeys = async () => {
  const secret = await mongo.secrets.findOne({ _id: 'signatureKeys' })
  if (secret) return secret.data as SignatureKeys
}

const readDeprecatedSignatureKeys = async () => {
  const privateKeyPath = resolve(config.secret.private)
  const publicKeyPath = resolve(config.secret.public)
  try {
    await access(privateKeyPath, constants.R_OK)
    await access(publicKeyPath, constants.R_OK)
  } catch (err) {
    return null
  }
  return {
    privateKey: await readFile(privateKeyPath, 'utf8'),
    publicKey: await readFile(publicKeyPath, 'utf8')
  }
}

const createWekKey = (publicKey: string) => {
  const webKey = JSONWebKey.fromPEM(publicKey)
  webKey.kid = config.kid + '-' + nanoid()
  webKey.alg = 'RS256'
  webKey.use = 'sig'
  return webKey.toJSON() as WebKey
}

const rotateKeys = async () => {
  const existingKeys = await readSignatureKeys()
  const newKeys = await createKeys()
  const webKeys = [createWekKey(newKeys.publicKey)]
  if (existingKeys) webKeys.push(existingKeys.webKeys[0])
}

const createKeys = async () => {
  const privateKey = (await execAsync('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048')).stdout
  const publicPromise = execAsync('openssl rsa -outform PEM -pubout')
  publicPromise.child.stdin?.write(privateKey)
  publicPromise.child.stdin?.end()
  const publicKey = (await publicPromise).stdout
  return { privateKey, publicKey }
}
