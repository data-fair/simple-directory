import config from './config.ts'
import { publicMessages } from '../i18n/index.ts'

export const uiConfig = {
  publicMessages,
  readonly: config.storage.type !== 'mongo',
  publicUrl: config.publicUrl,
  theme: config.theme,
  manageSites: config.manageSites,
  i18n: config.i18n,
  tosUrl: config.tosUrl,
  passwordless: config.passwordless,
  onlyCreateInvited: config.onlyCreateInvited,
  maildev: config.maildev,
  depAdminIsOrgAdmin: config.depAdminIsOrgAdmin,
  anonymousContactForm: config.anonymousContactForm,
  homePage: config.homePage,
  alwaysAcceptInvitation: config.alwaysAcceptInvitation,
  avatars: config.avatars,
  manageDepartments: config.manageDepartments
}
export type UiConfig = typeof uiConfig
export default uiConfig
