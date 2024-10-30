import config, { type ApiConfig } from './config.ts'
import { publicMessages } from '../i18n/index.ts'

export type UiConfig = { publicMessages: any, readonly: boolean } & Pick<ApiConfig, 'publicUrl' | 'theme' | 'manageSites' | 'i18n' | 'tosUrl' | 'passwordless' | 'onlyCreateInvited' | 'maildev'>

export const uiConfig: UiConfig = {
  publicMessages,
  readonly: config.storage.type !== 'mongo',
  publicUrl: config.publicUrl,
  theme: config.theme,
  manageSites: config.manageSites,
  i18n: config.i18n,
  tosUrl: config.tosUrl,
  passwordless: config.passwordless,
  onlyCreateInvited: config.onlyCreateInvited,
  maildev: config.maildev
}
export default uiConfig
