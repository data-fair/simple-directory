import config, { type ApiConfig } from './config.ts'
import { publicMessages } from '../i18n/index.ts'

export type UiConfig = Pick<ApiConfig, 'publicUrl' | 'theme' | 'manageSites' | 'i18n'> & { publicMessages: any }

export const uiConfig: UiConfig = {
  publicUrl: config.publicUrl,
  theme: config.theme,
  manageSites: config.manageSites,
  i18n: config.i18n,
  publicMessages
}
export default uiConfig
