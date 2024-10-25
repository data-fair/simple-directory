import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import UserSchema from '#types/user/schema.js'

const body = jsonSchema(UserSchema)
  .removeReadonlyProperties()
  .pickProperties(['firstName', 'lastName', 'email', 'password', 'birthday'])
  .removeId()
  .appendTitle(' post')
  .schema

body.properties.password = { type: 'string' }

export default {
  $id: 'https://github.com/data-fair/simple-directory/users/post-req',
  title: 'Post user req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body,
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        invit_token: { type: 'string' },
        redirect: { type: 'string' },
        org: { type: 'string' },
        dep: { type: 'string' }
      }
    }
  }
}
