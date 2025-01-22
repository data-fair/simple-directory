export default {
  $id: 'https://github.com/data-fair/simple-directory/organizations/post-partner-req',
  'x-exports': [
    'types',
    'validate'
  ],
  title: 'Post partner req',
  type: 'object',
  required: [
    'body'
  ],
  properties: {
    body: {
      additionalProperties: false,
      required: [
        'name',
        'contactEmail'
      ],
      properties: {
        name: {
          type: 'string'
        },
        redirect: {
          type: 'string'
        },
        contactEmail: {
          type: 'string',
          format: 'email'
        }
      }
    }
  }
}
