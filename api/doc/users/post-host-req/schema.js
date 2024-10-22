export default {
  $id: 'https://github.com/data-fair/simple-directory/users/post-host-req',
  title: 'Post user host req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['host'],
      properties: {
        host: { type: 'string' }
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
