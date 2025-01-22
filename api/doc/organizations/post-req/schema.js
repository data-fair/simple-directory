import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import OrganizationSchema from '#types/organization/schema.js'

const body = jsonSchema(OrganizationSchema)
  .removeReadonlyProperties()
  .removeProperties(['created', 'updated', 'orgStorage'])
  .removeFromRequired('id')
  .removeId()
  .appendTitle(' post')
  .schema

export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/post-req',
  title: 'Post organization req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: { body }
}
