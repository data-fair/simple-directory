export default {
  $id: 'https://github.com/data-fair/simple-directory/auth/post-nhi-token-req',
  title: 'Post NHI token req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  additionalProperties: false,
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['client_id', 'assertion'],
      properties: {
        client_id: { type: 'string', maxLength: 100 },
        assertion: { type: 'string', maxLength: 10000 }
      }
    }
  }
}
