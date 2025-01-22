export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/post-partner-accept-req',
  'x-exports': [
    'types',
    'validate'
  ],
  title: 'Post partner accept req',
  type: 'object',
  required: [
    'body'
  ],
  properties: {
    body: {
      additionalProperties: false,
      required: ['id', 'contactEmail', 'token'],
      properties: {
        id: {
          type: 'string'
        },
        contactEmail: {
          type: 'string',
          format: 'email'
        },
        token: {
          type: 'string'
        }
      }
    }
  }
}
