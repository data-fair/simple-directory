import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import UserSchema from '#types/user/schema.js'

const body = jsonSchema(UserSchema)
  .removeReadonlyProperties()
  .pickProperties(['firstName', 'lastName', 'birthday', 'ignorePersonalAccount', 'defaultOrg', 'defaultDep', 'plannedDeletion', 'maxCreatedOrgs', 'email', '2FA'])
  .makeNullable(['firstName', 'lastName', 'birthday', 'ignorePersonalAccount', 'defaultOrg', 'defaultDep', 'plannedDeletion', 'maxCreatedOrgs', '2FA'])
  .removeFromRequired(['email'])
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
