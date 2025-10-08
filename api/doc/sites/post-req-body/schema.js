import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SiteSchema from '#types/site/schema.js'

const schema = jsonSchema(SiteSchema)
  .removeReadonlyProperties()
  .pickProperties(['_id', 'owner', 'host', 'path', 'theme'])
  .removeFromRequired(['_id', 'theme'])
  .appendTitle(' post')
  .schema

schema.properties.contact = { type: 'string', layout: 'none' }

schema['$defs'].oidcProvider.properties.client.properties.secret.type = 'string'
schema.properties.theme.layout = 'none'
schema.$id = 'https://github.com/data-fair/simple-directory/sites/post-req-body'
schema['x-exports'] = ['validate', 'types', 'resolvedSchemaJson', 'vjsf']
schema['x-vjsf'] = { xI18n: true }
schema['x-vjsf-locales'] = ['en', 'fr', 'it', 'de', 'pt', 'es']

export default schema
