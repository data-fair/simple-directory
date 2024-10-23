import type { AxiosAuthOptions } from '@data-fair/lib-node/axios-auth.js'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import mongo from '@data-fair/lib-node/mongo.js'

const directoryUrl = 'http://localhost:5689/simple-directory'

const axiosOpts = { baseURL: 'http://localhost:5689/simple-directory' }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })

export const axiosAuth = (opts: string | Omit<AxiosAuthOptions, 'directoryUrl' | 'axiosOpts' | 'password'>) => {
  opts = typeof opts === 'string' ? { email: opts } : opts
  const password = opts.email === 'superadmin@test.com' ? 'superpasswd' : 'passwd'
  return _axiosAuth({ ...opts, password, axiosOpts, directoryUrl })
}

export const clean = async () => {
  for (const name of ['users', 'organizations']) {
    await mongo.db.collection(name).deleteMany({})
  }
}

process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

export const startApiServer = async () => {
  process.env.NODE_CONFIG_DIR = 'api/config/'
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
}
