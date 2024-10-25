import config from '#config'
import mongo from '#mongo'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { readFile, access, constants } from 'node:fs/promises'
import memoize from 'memoizee'
import JSONWebKey from 'json-web-key'
import { randomUUID } from 'node:crypto'
import dayjs from 'dayjs'
import * as locks from '@data-fair/lib-node/locks.js'
import { cipher, decipher } from '../utils/cipher.ts'

type WebKey = { alg: 'RS256', kid: string, use: 'sig' }
type SignatureKeys = { privateKey: string, publicKey: string, webKeys: [WebKey, WebKey?], lastUpdate: Date }

const execAsync = promisify(exec)

let stopped = false
let rotatePromise: Promise<void> | undefined

export const start = async () => {
  const existingKeys = await readSignatureKeys()
  if (existingKeys) return

  // manage transition with old FS based persistence of keys
  const existingFSKeys = await readDeprecatedSignatureKeys()
  if (existingFSKeys) {
    const signatureKeys: SignatureKeys = { ...existingFSKeys, webKeys: [createWekKey(existingFSKeys.publicKey)], lastUpdate: new Date() }
    await writeSignatureKeys(signatureKeys)
    return
  }

  const newKeys = await createKeys()
  const signatureKeys: SignatureKeys = { ...newKeys, webKeys: [createWekKey(newKeys.publicKey)], lastUpdate: new Date() }
  await writeSignatureKeys(signatureKeys)

  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    if (await locks.acquire('signature-keys-rotation')) {
      const signatureKeys = await getSignatureKeys()
      if (dayjs().diff(dayjs(signatureKeys.lastUpdate), 'day') > 15) {
        rotatePromise = rotateKeys()
        await rotatePromise
      }
      await locks.release('signature-keys-rotation')
    }
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
  }
}

export const stop = async () => {
  stopped = true
  if (rotatePromise) await rotatePromise
}

export const getSignatureKeys = memoize(async () => {
  const signatureKeys = await readSignatureKeys()
  if (!signatureKeys) throw new Error('signature keys were not initialized')
  return signatureKeys
}, { promise: true, maxAge: 10000 })

const readSignatureKeys = async () => {
  const secret = await mongo.secrets.findOne({ _id: 'signature-keys' })
  if (secret) {
    const signatureKeys = secret.data
    signatureKeys.privateKey = decipher(signatureKeys.privateKey)
    return signatureKeys as SignatureKeys
  }
}

const writeSignatureKeys = async (signatureKeys: SignatureKeys) => {
  const storedSignatureKeys = { ...signatureKeys } as any
  storedSignatureKeys.privateKey = cipher(signatureKeys.privateKey)
  await mongo.secrets.insertOne({ _id: 'signature-keys', data: storedSignatureKeys })
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
  webKey.kid = config.kid + '-' + randomUUID()
  webKey.alg = 'RS256'
  webKey.use = 'sig'
  return webKey.toJSON() as WebKey
}

// TODO: a script to force key rotation for testing ?
export const rotateKeys = async () => {
  const existingKeys = await readSignatureKeys()
  const newKeys = await createKeys()
  const webKeys: [WebKey, WebKey?] = [createWekKey(newKeys.publicKey)]
  if (existingKeys) webKeys.push(existingKeys.webKeys[0])
  await writeSignatureKeys({ ...newKeys, webKeys, lastUpdate: new Date() })
}

const createKeys = async () => {
  const privateKey = (await execAsync('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048')).stdout
  const publicPromise = execAsync('openssl rsa -outform PEM -pubout')
  publicPromise.child.stdin?.write(privateKey)
  publicPromise.child.stdin?.end()
  const publicKey = (await publicPromise).stdout
  return { privateKey, publicKey }
}