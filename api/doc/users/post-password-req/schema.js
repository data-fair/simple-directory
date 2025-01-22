export default {
  $id: 'https://github.com/data-fair/simple-directory/users/post-password-req',
  title: 'Post user password req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['password'],
      properties: {
        password: { type: 'string' }
      }
    },
    query: {
      type: 'object',
      additionalProperties: false,
      required: ['action_token'],
      properties: {
        action_token: { type: 'string' }
      }
    }
  }
}
