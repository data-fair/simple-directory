import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SiteSchema from '#types/site/schema.js'

const schema = jsonSchema(SiteSchema)
  .removeReadonlyProperties()
  .pickProperties(['title', 'theme', 'reducedPersonalInfoAtCreation', 'tosMessage', 'mails', 'authMode', 'authOnlyOtherSite', 'authProviders'])
  .appendTitle(' patch')
  .schema

delete schema.required
schema.$id = 'https://github.com/data-fair/simple-directory/sites/patch-req-body'
schema['x-exports'] = ['validate', 'types', 'resolvedSchemaJson']

schema.layout = {
  title: null,
  children: [
    { title: 'Informations générales', children: ['title'] },
    { key: 'theme' },
    { key: 'mails' },
    {
      title: 'Gestion des utilisateurs',
      children: ['reducedPersonalInfoAtCreation', 'tosMessage', 'authMode', 'authOnlyOtherSite', 'authProviders']
    }
  ]
}

export default schema
