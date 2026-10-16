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
import locks from '@data-fair/lib-node/locks.js'
import { cipher, decipher } from '../utils/cipher.ts'
import { internalError } from '@data-fair/lib-node/observer.js'

type WebKey = { alg: 'RS256', kid: string, use: 'sig' }
type SignatureKeys = { privateKey: string, publicKey: string, webKeys: [WebKey, WebKey?], lastUpdate: Date }

export type KeySet = 'session' | 'scoped'
const secretIds: Record<KeySet, string> = { session: 'signature-keys', scoped: 'scoped-signature-keys' }

const execAsync = promisify(exec)

let stopped = false
let rotatePromise: Promise<void> | undefined

export const start = async () => {
  // the libs look up a key id starting with "scoped-" only in the scoped key set
  if (config.kid.startsWith('scoped-')) {
    throw new Error(`config.kid "${config.kid}" must not start with "scoped-", this prefix is reserved to the scoped tokens key set`)
  }
  const existingKeys = await readSignatureKeys('session')
  if (!existingKeys) {
    console.log('Initializing signature keys')
    // manage transition with old FS based persistence of keys
    const existingFSKeys = await readDeprecatedSignatureKeys()
    if (existingFSKeys) {
      console.log('Migrating signature keys from filesystem to database')
      const signatureKeys: SignatureKeys = { ...existingFSKeys, webKeys: [createWekKey(existingFSKeys.publicKey, 'simple-directory')], lastUpdate: new Date() }
      await writeSignatureKeys('session', signatureKeys)
    } else {
      console.log('Generating new signature keys')
      const newKeys = await createKeys()
      const signatureKeys: SignatureKeys = { ...newKeys, webKeys: [createWekKey(newKeys.publicKey)], lastUpdate: new Date() }
      await writeSignatureKeys('session', signatureKeys)
    }
  }

  // the scoped set is never migrated from the filesystem
  if (!await readSignatureKeys('scoped')) {
    console.log('Generating new scoped signature keys')
    const newKeys = await createKeys()
    await writeSignatureKeys('scoped', { ...newKeys, webKeys: [createWekKey(newKeys.publicKey, undefined, 'scoped')], lastUpdate: new Date() })
  }

  rotateLoop()
}

const rotateLoop = async () => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    try {
      if (await locks.acquire('signature-keys-rotation')) {
        for (const keySet of ['session', 'scoped'] as KeySet[]) {
          const signatureKeys = await getSignatureKeys(keySet)
          if (dayjs().diff(dayjs(signatureKeys.lastUpdate), 'day') > 30) {
            rotatePromise = rotateKeys(keySet)
            await rotatePromise
          }
        }
        await locks.release('signature-keys-rotation')
      }
    } catch (err) {
      internalError('sign-keys-rotation', err)
    }
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
  }
}

export const stop = async () => {
  stopped = true
  if (rotatePromise) await rotatePromise
}

// length: 1 because a function with a default parameter reports length 0 and memoizee would ignore the key set
export const getSignatureKeys = memoize(async (keySet: KeySet = 'session') => {
  const signatureKeys = await readSignatureKeys(keySet)
  if (!signatureKeys) throw new Error('signature keys were not initialized')
  return signatureKeys
}, { promise: true, maxAge: 10000, primitive: true, length: 1 })

const readSignatureKeys = async (keySet: KeySet) => {
  const secret = await mongo.secrets.findOne({ _id: secretIds[keySet] })
  if (secret) {
    const signatureKeys = secret.data
    signatureKeys.privateKey = decipher(signatureKeys.privateKey)
    return signatureKeys as SignatureKeys
  }
}

const writeSignatureKeys = async (keySet: KeySet, signatureKeys: SignatureKeys) => {
  const storedSignatureKeys = { ...signatureKeys } as any
  storedSignatureKeys.privateKey = cipher(signatureKeys.privateKey)
  await mongo.secrets.replaceOne({ _id: secretIds[keySet] }, { data: storedSignatureKeys }, { upsert: true })
}

const readDeprecatedSignatureKeys = async () => {
  const privateKeyPath = resolve(config.secret.private)
  const publicKeyPath = resolve(config.secret.public)
  try {
    await access(privateKeyPath, constants.R_OK)
    await access(publicKeyPath, constants.R_OK)
  } catch (err) {
    // TODO: remove this log after a few months
    console.log('No deprecated signature keys found, this message is expected on a new deployment', err)
    return null
  }
  return {
    privateKey: await readFile(privateKeyPath, 'utf8'),
    publicKey: await readFile(publicKeyPath, 'utf8')
  }
}

const createWekKey = (publicKey: string, kid?: string, keySet: KeySet = 'session') => {
  const webKey = JSONWebKey.fromPEM(publicKey)
  webKey.kid = kid ?? ((keySet === 'scoped' ? 'scoped-' : '') + config.kid + '-' + randomUUID())
  webKey.alg = 'RS256'
  webKey.use = 'sig'
  return webKey.toJSON() as WebKey
}

const rotateKeySet = async (keySet: KeySet) => {
  console.log(`Rotating ${keySet} signature keys`)
  const existingKeys = await readSignatureKeys(keySet)
  const newKeys = await createKeys()
  const webKeys: [WebKey, WebKey?] = [createWekKey(newKeys.publicKey, undefined, keySet)]
  if (existingKeys) webKeys.push(existingKeys.webKeys[0])
  await writeSignatureKeys(keySet, { ...newKeys, webKeys, lastUpdate: new Date() })
}

// no argument rotates both key sets
export const rotateKeys = async (keySet?: KeySet) => {
  if (keySet) await rotateKeySet(keySet)
  else {
    await rotateKeySet('session')
    await rotateKeySet('scoped')
  }
}

const createKeys = async () => {
  const privateKey = (await execAsync('openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048')).stdout
  const publicPromise = execAsync('openssl rsa -outform PEM -pubout')
  publicPromise.child.stdin?.write(privateKey)
  publicPromise.child.stdin?.end()
  const publicKey = (await publicPromise).stdout
  return { privateKey, publicKey }
}
