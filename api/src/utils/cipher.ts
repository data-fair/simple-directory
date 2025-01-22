// contrary to a hash password sometimes we must be able to read again a sensitive information
// but still not store it as clear text
// in this case we use this simple cipher/decipher mechanism based on a secret in an env var

import config from '#config'
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

type CipheredContent = { iv: string, alg: 'aes256', data: string }

// the secret key for cipher/decipher is a simple hash of config.cipherPassword
const hash = createHash('sha256')
hash.update(config.cipherPassword)
const securityKey = hash.digest()

export const cipher = (content: string): CipheredContent => {
  const initVector = randomBytes(16)
  const algo = 'aes256'
  const cipher = createCipheriv(algo, securityKey, initVector)
  let encryptedData = cipher.update(content, 'utf-8', 'hex')
  encryptedData += cipher.final('hex')
  return {
    iv: initVector.toString('hex'),
    alg: algo,
    data: encryptedData
  }
}

export const decipher = (cipheredContent: CipheredContent | string): string => {
  if (typeof cipheredContent === 'string') return cipheredContent
  const decipher = createDecipheriv(cipheredContent.alg, securityKey, Buffer.from(cipheredContent.iv, 'hex'))
  let content = decipher.update(cipheredContent.data, 'hex', 'utf-8')
  content += decipher.final('utf8')
  return content
}
