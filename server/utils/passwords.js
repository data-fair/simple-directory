const crypto = require('crypto')
const config = require('config')
const util = require('util')
const randomBytes = util.promisify(crypto.randomBytes)
const pbkdf2 = util.promisify(crypto.pbkdf2)

const params = { iterations: 100000, size: 64, alg: 'sha512' }

exports.validate = (password, errorMessages) => {
  if (password.length < 8) return false
  if (!/[a-z]/.exec(password)) return false
  if (!/[A-Z]/.exec(password)) return false
  if (!/[0-9]/.exec(password)) return false
  return true
}

// Derive a hashed key from a password, and return the key and all associated params
// so that we can verify keys even if hashing params are changed
exports.hashPassword = async (password) => {
  const salt = await randomBytes(16)
  const hash = await pbkdf2(password, salt, params.iterations, params.size, params.alg)
  return { hash: hash.toString('hex'), salt: salt.toString('hex'), ...params }
}

// Use the same salt and params as used to derive the original key
exports.checkPassword = async (password, storedPassword) => {
  if (!password || !storedPassword) return false
  // minimalist storage engines can store password in clear text
  if (storedPassword.clear) {
    return storedPassword.clear === password
  }
  const newHash = await pbkdf2(password, Buffer.from(storedPassword.salt, 'hex'), storedPassword.iterations, storedPassword.size, storedPassword.alg)
  return newHash.toString('hex') === storedPassword.hash
}

// the secret key for cipher/decipher is a simple hash of config.cipherPassword
let securityKey
if (config.cipherPassword) {
  const hash = crypto.createHash('sha256')
  hash.update(config.cipherPassword)
  securityKey = hash.digest()
}

// contrary to a hash password the ciphered password can be read,
// we use this to store ldap credentials for example
exports.cipherPassword = (password) => {
  const initVector = crypto.randomBytes(16)
  if (!config.cipherPassword) throw new Error('cipherPassword config option is missing')
  const algo = 'aes256'
  const cipher = crypto.createCipheriv(algo, securityKey, initVector)
  let encryptedData = cipher.update(password, 'utf-8', 'hex')
  encryptedData += cipher.final('hex')
  return {
    iv: initVector.toString('hex'),
    alg: algo,
    data: encryptedData
  }
}

exports.decipherPassword = (storedPassword) => {
  if (typeof storedPassword === 'string') return storedPassword
  if (!config.cipherPassword) throw new Error('cipherPassword config option is missing')
  const decipher = crypto.createDecipheriv(storedPassword.alg, securityKey, Buffer.from(storedPassword.iv, 'hex'))
  let password = decipher.update(storedPassword.data, 'hex', 'utf-8')
  password += decipher.final('utf8')
  return password
}
