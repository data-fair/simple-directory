const config = require('config')
const path = require('path')
const util = require('util')
const { exec } = require('child_process')
const execAsync = util.promisify(exec)
const fs = require('fs-extra')
const express = require('express')
const jwt = require('jsonwebtoken')
const asyncVerify = util.promisify(jwt.verify)
const JSONWebKey = require('json-web-key')

exports.init = async () => {
  const keys = {}
  const privateKeyPath = path.resolve(__dirname, '../..', config.secret.private)
  const publicKeyPath = path.resolve(__dirname, '../..', config.secret.public)
  try {
    await fs.access(privateKeyPath, fs.constants.F_OK)
  } catch (err) {
    if (err.code !== 'ENOENT') throw (err)
    console.log(`Private key ${privateKeyPath} doesn't exist. Create it with openssl.`)
    await fs.ensureDir(path.dirname(privateKeyPath))
    await fs.ensureDir(path.dirname(publicKeyPath))
    await execAsync(`openssl genpkey -algorithm RSA -out ${privateKeyPath} -pkeyopt rsa_keygen_bits:2048`)
    await execAsync(`openssl rsa -in ${privateKeyPath} -outform PEM -pubout -out  ${publicKeyPath}`)
  }
  keys.private = await fs.readFile(privateKeyPath)
  keys.public = await fs.readFile(publicKeyPath)
  return keys
}

exports.router = (keys) => {
  const router = express.Router()
  const publicKey = JSONWebKey.fromPEM(keys.public)
  publicKey.kid = config.kid
  publicKey.alg = 'RS256'
  publicKey.use = 'sig'
  router.get('/.well-known/jwks.json', (req, res) => {
    res.json({ keys: [publicKey.toJSON()] })
  })
  return router
}

exports.sign = (keys, payload, expiresIn, notBefore) => {
  const params = {
    algorithm: 'RS256',
    expiresIn,
    keyid: config.kid,
  }
  if (notBefore) params.notBefore = notBefore
  return jwt.sign(payload, keys.private, params)
}

exports.verify = async (keys, token) => asyncVerify(token, keys.public)

exports.decode = (token) => jwt.decode(token)

exports.getPayload = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: user.organizations,
    isAdmin: config.admins.includes(user.email),
  }
  if (user.department) payload.department = user.department
  return payload
}
