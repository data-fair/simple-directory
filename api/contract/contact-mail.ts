export default {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'subject', 'text'],
  properties: {
    from: {
      type: 'string',
      format: 'email'
    },
    subject: {
      type: 'string'
    },
    text: {
      type: 'string'
    }
  }
}
