export default {
  $id: 'https://github.com/data-fair/simple-directory/auth/post-action-req',
  title: 'Post action auth req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['email', 'action', 'redirect'],
      properties: {
        email: { type: 'string' },
        action: {
          type: 'string',
          enum: ['changePassword']
        },
        redirect: { type: 'string' }
      }
    }
  }
}
