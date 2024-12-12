import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import UserSchema from '#types/user/schema.js'

const body = jsonSchema(UserSchema)
  .removeReadonlyProperties()
  .pickProperties(['firstName', 'lastName', 'birthday', 'ignorePersonalAccount', 'defaultOrg', 'defaultDep', 'plannedDeletion'])
  .makeNullable(['birthday'])
  .removeId()
  .appendTitle(' patch')
  .schema

export default {
  $id: 'https://github.com/data-fair/simple-directory/users/patch-req',
  title: 'Patch user req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: { body }
}
