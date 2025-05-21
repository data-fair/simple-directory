import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SiteSchema from '#types/site/schema.js'

const schema = jsonSchema(SiteSchema)
  .removeReadonlyProperties()
  .pickProperties(['theme', 'reducedPersonalInfoAtCreation', 'tosMessage', 'mails', 'authMode', 'authOnlyOtherSite', 'authProviders'])
  .appendTitle(' patch')
  .schema

schema['$defs'].oidcProvider.properties.client.properties.secret.type = 'string'
delete schema.required
schema.$id = 'https://github.com/data-fair/simple-directory/sites/patch-req-body'
schema['x-exports'] = ['validate', 'types', 'resolvedSchemaJson', 'vjsf']

schema.layout = {
  title: null,
  children: [
    { key: 'theme' },
    { key: 'mails' },
    {
      title: 'Gestion des utilisateurs',
      children: ['reducedPersonalInfoAtCreation', 'tosMessage', 'authMode', 'authOnlyOtherSite', 'authProviders']
    }
  ]
}

export default schema
