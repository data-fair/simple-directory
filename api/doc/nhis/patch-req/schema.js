export default {
  $id: 'https://github.com/data-fair/simple-directory/nhis/patch-req',
  title: 'Patch NHI req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', maxLength: 150 },
        role: { type: 'string', maxLength: 100 },
        department: { type: 'string', maxLength: 100 },
        subject: { type: 'string', maxLength: 500 },
        provider: {
          type: 'object',
          additionalProperties: false,
          required: ['issuer'],
          properties: {
            issuer: { type: 'string', maxLength: 500 },
            jwks: { type: 'object' }
          }
        }
      }
    }
  }
}
