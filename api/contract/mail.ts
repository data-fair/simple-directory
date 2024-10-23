export default {
  type: 'object',
  additionalProperties: false,
  required: ['to', 'subject', 'text'],
  properties: {
    to: {
      description: 'Array of users / organizations recipient of the email',
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'id'],
        properties: {
          id: {
            type: 'string',
            description: 'Id of the user or organization'
          },
          type: {
            type: 'string',
            enum: ['user', 'organization']
          },
          role: {
            type: 'string',
            description: 'If the recipient is an organization, you can restric to the members with a certain role'
          }
        }
      }
    },
    subject: {
      type: 'string'
    },
    text: {
      type: 'string'
    },
    html: {
      type: 'string'
    }
  }
}
