export default {
  id: 'https://lets-encrypt.org/schema/01/jwk#',
  $schema: 'http://json-schema.org/draft-04/schema#',
  description: 'Schema for a jwk (**kty RSA/e=65537 ONLY**)',
  type: 'object',
  required: ['kty', 'e', 'n'],
  properties: {
    kty: {
      enum: ['RSA']
    },
    e: {
      enum: ['AQAB']
    },
    n: {
      type: 'string',
      pattern: '^[-_=0-9A-Za-z]+$'
    }
  }
}
