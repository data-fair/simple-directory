import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import UserSchema from '#types/user/schema.js'

const body = jsonSchema(UserSchema)
  .removeReadonlyProperties()
  .pickProperties(['firstName', 'lastName', 'email', 'password', 'birthday'])
  .removeId()
  .appendTitle(' post')
  .schema

body.properties.password = { type: 'string' }
// anonymous-action token required for unauthenticated callers (bot / email-amplifier gate)
body.properties.token = { type: 'string' }
// self-service signup through this endpoint is always for a human user and must keep
// requiring an email, independently of whether the base User schema ever relaxes it
// (NHI users, see api/types/user/schema.js, nearly made it optional)
body.required = [...new Set([...(body.required ?? []), 'email'])]

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
