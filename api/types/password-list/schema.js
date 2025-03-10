export default {
  type: 'object',
  title: 'Password List',
  required: [
    '_id',
    'name',
    'active',
    'createdAt',
    'size',
    'count'
  ],
  properties: {
    _id: {
      type: 'string',
      title: 'ID',
      readOnly: true
    },
    name: {
      type: 'string',
      title: 'Name'
    },
    active: {
      type: 'boolean',
      title: 'Active'
    },
    createdAt: {
      type: 'string',
      title: 'Last Updated',
      format: 'date-time',
      readOnly: true
    },
    size: {
      type: 'number',
      title: 'Size',
      readOnly: true
    },
    count: {
      type: 'number',
      title: 'Count',
      readOnly: true
    },
  }
}
