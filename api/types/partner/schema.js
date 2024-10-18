export default {
  $id: 'https://github.com/data-fair/simple-directory/partner',
  'x-exports': ['types'],
  title: 'Partner',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'contactEmail', 'partnerId', 'createdAt'],
  properties: {
    name: { type: 'string' },
    contactEmail: { type: 'string' },
    partnerId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' }
  }
}
