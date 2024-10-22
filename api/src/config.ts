import type { User } from '#types'
import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import config from 'config'

// manage retro-compatibility with older env vars
const envAliases = [
  ['STORAGE_MONGO_URL', 'MONGO_URL'],
  ['STORAGE_MONGO_CLIENT_OPTIONS', 'MONGO_OPTIONS']
]
for (const envAlias of envAliases) {
  if (process.env[envAlias[0]]) process.env[envAlias[1]] = process.env[envAlias[0]]
}

// we reload the config instead of using the singleton from the config module for testing purposes
// @ts-ignore
const apiConfig = process.env.NODE_ENV === 'test' ? config.util.loadFileConfigs(process.env.NODE_CONFIG_DIR, { skipConfigSources: true }) : config

assertValid(apiConfig, { lang: 'en', name: 'config', internal: true })

export default apiConfig as ApiConfig

export type UiConfig = {}

export const uiConfig: UiConfig = {}

export const superadmin: User = {
  created: { date: new Date().toISOString() },
  updated: { date: new Date().toISOString() },
  id: '_superadmin',
  name: 'Super Admin',
  email: apiConfig.adminCredentials?.email ?? '',
  organizations: []
}
