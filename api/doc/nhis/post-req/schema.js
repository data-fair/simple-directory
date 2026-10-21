export default {
  $id: 'https://github.com/data-fair/simple-directory/nhis/post-req',
  title: 'Post NHI req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      // subject and provider together (the key binding) or neither (an NHI for OAuth clients only)
      required: ['name', 'role'],
      properties: {
        name: { type: 'string', maxLength: 150 },
        role: { type: 'string', maxLength: 100 },
        department: { type: 'string', maxLength: 100 },
        subject: { type: 'string', maxLength: 500 },
        allowedIps: { type: 'array', maxItems: 50, items: { type: 'string', maxLength: 50 } },
        ipBinding: { type: 'boolean' },
        scopes: { type: 'array', minItems: 1, maxItems: 50, items: { type: 'string', maxLength: 100 } },
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
