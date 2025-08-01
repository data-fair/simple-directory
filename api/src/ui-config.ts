import config, { jwtDurations } from './config.ts'
import { publicMessages } from '../i18n/messages.ts'

export const uiConfig = {
  publicMessages,
  jwtDurations,
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
  invitationRedirect: config.invitationRedirect,
  avatars: config.avatars,
  manageRolesLabels: config.manageRolesLabels,
  defaultRolesLabels: config.defaultRolesLabels,
  manageDepartments: config.manageDepartments,
  manageDepartmentLabel: config.manageDepartmentLabel,
  defaultDepartmentLabel: config.defaultDepartmentLabel,
  managePartners: config.managePartners,
  manageSessions: config.manageSessions,
  quotas: config.quotas,
  perOrgStorageTypes: config.perOrgStorageTypes,
  plannedDeletionDelay: config.plannedDeletionDelay,
  noBirthday: config.noBirthday,
  userSelfDelete: config.userSelfDelete,
  orgStorageOverwrite: config.storage.ldap.overwrite,
  useEvents: Boolean(config.secretKeys.events && config.privateEventsUrl),
  passwordValidation: config.passwordValidation,
  siteOrgs: config.siteOrgs,
  siteAdmin: config.siteAdmin,
  multiRoles: config.multiRoles,
  asAdmin: config.asAdmin
}
export type UiConfig = typeof uiConfig
export default uiConfig
