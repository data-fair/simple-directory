import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import OrganizationSchema from '#types/organization/schema.js'

const body = jsonSchema(OrganizationSchema)
  .removeReadonlyProperties()
  .removeProperties(['created', 'updated'])
  .removeId()
  .appendTitle(' patch')
  .schema
delete body.required

export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/patch-req',
  title: 'Patch organization req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: { body }
}
