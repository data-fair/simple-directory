import { type User } from '#types'
import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import config from 'config'
import ms from 'ms'
import { defaultTheme } from '@data-fair/lib-common-types/theme/index.js'

export type { ApiConfig } from '../config/type/index.ts'

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

// merge theme defaults from @data-fair/lib-common-types/theme under any values
// provided by api/config/*.cjs or THEME_* environment variables
// @ts-ignore
const themeOverrides = config.util.cloneDeep(apiConfig.theme ?? {})

// When the operator provides a font configuration (either bodyFontFamily /
// headingFontFamily or its CSS counterpart) the lib's Nunito defaults
// would still merge in and the @font-face declarations would shadow the
// operator's CSS rules. Drop the matching lib defaults in that case so
// the env-provided values win cleanly.
// @ts-ignore
const baseTheme = config.util.cloneDeep(defaultTheme)
if (themeOverrides.bodyFontFamilyCss || themeOverrides.bodyFontFamily) {
  delete baseTheme.bodyFontFamily
  delete baseTheme.bodyFontFamilyCss
}
if (themeOverrides.headingFontFamilyCss || themeOverrides.headingFontFamily) {
  delete baseTheme.headingFontFamily
  delete baseTheme.headingFontFamilyCss
}

// @ts-ignore
config.util.extendDeep(apiConfig.theme, baseTheme, themeOverrides)

assertValid(apiConfig, { lang: 'en', name: 'config', internal: true })

for (let i = 0; i < apiConfig.admins.length; i++) {
  apiConfig.admins[i] = apiConfig.admins[i].toLowerCase()
}

export default apiConfig as ApiConfig

export const superadmin: User = {
  created: { date: new Date().toISOString() },
  updated: { date: new Date().toISOString() },
  id: '_superadmin',
  name: 'Super Admin',
  email: apiConfig.adminCredentials?.email ?? '',
  organizations: []
}

export const jwtDurations = {
  idToken: ms(apiConfig.jwtDurations.idToken) / 1000,
  exchangeToken: ms(apiConfig.jwtDurations.exchangeToken) / 1000,
  adminExchangeToken: ms(apiConfig.jwtDurations.adminExchangeToken) / 1000
}
