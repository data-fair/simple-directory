const config = require('config')
const JWK = require('./JWK.json')
const user = require('./user.json')
const organization = require('./organization.json')
const version = require('../package.json').version

module.exports = {
  openapi: '3.0.0',
  info: Object.assign({
    title: 'API documentation',
    version: version
  }, config.info),
  servers: [{
    url: config.publicUrl + '/api/v1',
    description: process.env.NODE_ENV || 'development' + ' server.'
  }],
  paths: {
    '/.well-known/jwks.json': {
      get: {
        summary: 'JSON Web Key Set',
        responses: {
          200: {
            description: 'JSON Web Key Set',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: JWK
                },
                examples: []
              }
            }
          }
        }
      }
    }
  }
}
