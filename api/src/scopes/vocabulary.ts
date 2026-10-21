import { defineScopes } from '@data-fair/lib-common-types/scopes.js'
import fr from '../../i18n/fr.js'
import en from '../../i18n/en.js'

// simple-directory's own scope vocabulary, built as in the other services of the platform: it adds
// the global tier scopes all:read / all:write / all:admin, that simple-directory both issues and
// accepts. The descriptions of every locale stay in the i18n messages (scopes).
const l = (key: keyof typeof en.scopes) => ({ fr: fr.scopes[key], en: en.scopes[key] })

export const vocabulary = defineScopes({
  organizations: { tiers: ['read'], descriptions: { umbrella: l('organizations'), read: l('organizations:read') } }
})
