import { pbkdf2 as pbkdf2Async, randomBytes as randomBytesAsync } from 'node:crypto'
import { promisify } from 'node:util'

const randomBytes = promisify(randomBytesAsync)
const pbkdf2 = promisify(pbkdf2Async)

const params = { iterations: 100000, size: 64, alg: 'sha512' as const }

type ClearPassword = { clear: string }
type HashedPassword = { hash: string, salt: string, iterations: number, size: number, alg: 'sha512' }
export type Password = ClearPassword | HashedPassword

function isClearPassword (password: Password): password is ClearPassword {
  return 'clear' in password
}

export const validatePassword = (password: string) => {
  if (password.length < 8) return false
  if (!/[a-z]/.exec(password)) return false
  if (!/[A-Z]/.exec(password)) return false
  if (!/[0-9]/.exec(password)) return false
  return true
}

// Derive a hashed key from a password, and return the key and all associated params
// so that we can verify keys even if hashing params are changed
export const hashPassword = async (password: string): Promise<HashedPassword> => {
  const salt = await randomBytes(16)
  const hash = await pbkdf2(password, salt, params.iterations, params.size, params.alg)
  return { hash: hash.toString('hex'), salt: salt.toString('hex'), ...params }
}

// Use the same salt and params as used to derive the original key
export const checkPassword = async (password: string, storedPassword: Password) => {
  if (!password || !storedPassword) return false
  // minimalist storage engines can store password in clear text
  if (isClearPassword(storedPassword)) {
    return storedPassword.clear === password
  } else {
    const newHash = await pbkdf2(password, Buffer.from(storedPassword.salt, 'hex'), storedPassword.iterations, storedPassword.size, storedPassword.alg)
    return newHash.toString('hex') === storedPassword.hash
  }
}
