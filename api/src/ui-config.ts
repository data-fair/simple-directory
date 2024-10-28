import config, { type ApiConfig } from './config.ts'
import { publicMessages } from '../i18n/index.ts'

export type UiConfig = Pick<ApiConfig, 'theme' | 'manageSites'> & { publicMessages: any }

export const uiConfig: UiConfig = {
  theme: config.theme,
  manageSites: config.manageSites,
  publicMessages
}
export default uiConfig
