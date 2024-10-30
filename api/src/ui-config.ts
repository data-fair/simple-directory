import config, { type ApiConfig } from './config.ts'
import { publicMessages } from '../i18n/index.ts'

export type UiConfig = Pick<ApiConfig, 'publicUrl' | 'theme' | 'manageSites'> & { publicMessages: any }

export const uiConfig: UiConfig = {
  publicUrl: config.publicUrl,
  theme: config.theme,
  manageSites: config.manageSites,
  publicMessages
}
export default uiConfig
