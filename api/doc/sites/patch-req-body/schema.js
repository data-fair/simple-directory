import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SiteSchema from '#types/site/schema.js'

const schema = jsonSchema(SiteSchema)
  .removeReadonlyProperties()
  .pickProperties(['theme', 'logo', 'reducedPersonalInfoAtCreation', 'tosMessage', 'authMode', 'authOnlyOtherSite', 'authProviders'])
  .removeId()
  .appendTitle(' patch')
  .schema

schema.$id = 'https://github.com/data-fair/simple-directory/sites/patch-req-body'
schema['x-exports'] = ['validate', 'types', 'resolvedSchema']

export default schema
