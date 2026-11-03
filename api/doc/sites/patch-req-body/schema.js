import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SiteSchema from '#types/site/schema.js'

const schema = jsonSchema(SiteSchema)
  .removeReadonlyProperties()
  .pickProperties(['title', 'isAccountMain', 'theme', 'reducedPersonalInfoAtCreation', 'tosMessage', 'mails', 'authMode', 'authOnlyOtherSite', 'authProviders', 'oauthClients'])
  .appendTitle(' patch')
  .schema

schema['$defs'].oidcProvider.properties.client.properties.secret.type = 'string'
// absent means true for a site provider (p.x ?? !trusted, cf docs/architecture/oidc-client.md): the form shows
// and initialises it so. A form only default, a schema default would leak into the root config validation
// (config.oidc.providers $refs the same oidcProvider definition, absent means false there)
schema['$defs'].oidcProvider.properties.strict.layout = { defaultData: true }
schema['$defs'].oidcProvider.properties.rpInitiatedLogout.layout = { defaultData: true }
delete schema.required
schema.$id = 'https://github.com/data-fair/simple-directory/sites/patch-req-body'
schema['x-exports'] = ['validate', 'types', 'resolvedSchemaJson', 'vjsf']
schema['x-vjsf'] = { xI18n: true }
schema['x-vjsf-locales'] = ['en', 'fr', 'it', 'de', 'pt', 'es']

schema.layout = {
  title: null,
  children: [
    {
      title: 'Informations générales',
      'x-i18n-title': {
        fr: 'Informations générales',
        en: 'General information',
        de: 'Allgemeine Informationen',
        it: 'Informazioni generali',
        pt: 'Informações gerais',
        es: 'Información general'
      },
      children: ['title', 'isAccountMain']
    },
    { key: 'theme' },
    { key: 'mails' },
    {
      title: 'Gestion des utilisateurs',
      'x-i18n-title': {
        fr: 'Gestion des utilisateurs',
        en: 'Users management',
        de: 'Benutzerverwaltung',
        it: 'Gestione utenti',
        pt: 'Gestão de usuários',
        es: 'Gestión de usuarios'
      },
      children: ['reducedPersonalInfoAtCreation', 'tosMessage', 'authMode', 'authOnlyOtherSite', 'authProviders']
    },
    { key: 'oauthClients' }
  ]
}

export default schema
