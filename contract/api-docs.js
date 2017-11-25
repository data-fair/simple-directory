const config = require('config')
const JWK = require('./JWK.json')
const user = require('./user.json')
const organization = require('./organization.json')
const version = require('../package.json').version

const authenticationParams = [{
  name: 'Authorization',
  in: 'header',
  description: '"Bearer" followed with a white space and a JWT',
  required: false,
  schema: {
    type: 'string'
  }
}, {
  name: 'id_token',
  in: 'cookie',
  description: 'JWT',
  required: false,
  schema: {
    type: 'string'
  }
}]

module.exports = {
  openapi: '3.0.0',
  info: Object.assign({
    title: 'API documentation',
    version: version
  }, config.info),
  servers: [{
    url: config.publicUrl,
    description: process.env.NODE_ENV || 'development' + ' server.'
  }],
  paths: {
    '/.well-known/jwks.json': {
      get: {
        tags: ['JWKS'],
        summary: 'JSON Web Key Set',
        responses: {
          200: {
            description: 'JSON Web Key Set',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keys: {
                      type: 'array',
                      items: JWK
                    }
                  }
                },
                examples: [{
                  keys: [{
                    kty: 'RSA',
                    n: 'tbzexDIgsl8qlZ4sOPgBnCgkumaK5mi6fE-Vc8Gk3bpmerMOIEMoj3dzkheBVD3R_1y9LSidmyJBouh8yqT7wGNzsBlB8-6W2ihnrCtg437RKksjfcHheKeYV_Rv7v9jkNQj171KCbptCQV0orwDhhslWwNPS4Ss4Vwy0Ly1rMGyLI8qwinw7f2p5N6xDxo2tBUxqdfOrx-_YlpWajZgftYRkVITKiMeSPHMsdWxmX_qH1BqoOIy4-9zuBQFt_QxSSwjqWLKyH22ave69a3J_1_urqYLuCSxPnV8t0FquR6fghBiaB22DBbiQHtlUEnOrAUGlktF0lH_q6g1T4DYdQ',
                    e: 'AQAB',
                    kid: 'simple-directory-default',
                    alg: 'RS256',
                    use: 'sig'
                  }]
                }]
              }
            }
          }
        }
      }
    },
    '/auth/passwordless': {
      post: {
        tags: ['Authentication'],
        summary: 'To get a JWT from an email',
        operationId: 'authPasswordless',
        parameters: [{
          name: 'redirect',
          in: 'query',
          description: 'A redirect URL',
          required: false,
          schema: {
            type: 'string'
          }
        }],
        requestBody: {
          description: 'Email of the account',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    description: 'The main email of the account',
                    type: 'string',
                    format: 'email'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'A JWT, or the input redirect URL concatenated with a JWT'
          },
          400: {
            description: 'Input data has wrong format'
          },
          404: {
            description: 'There is no user associated with this email'
          }
        }
      }
    },
    '/auth/exchange': {
      post: {
        tags: ['Authentication'],
        summary: 'Renew a JWT',
        operationId: 'authExchange',
        parameters: authenticationParams,
        responses: {
          200: {
            description: 'A JWT'
          },
          401: {
            description: 'Authentication error'
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Fetch user data',
        parameters: authenticationParams.concat([{
          name: 'id',
          in: 'path',
          description: 'Unique identifier of the user',
          required: true,
          schema: {
            type: 'string'
          }
        }]),
        responses: {
          200: {
            description: 'The requested user',
            content: {
              'application/json': {
                schema: user
              }
            }
          },
          401: {
            description: 'Authentication error'
          },
          403: {
            description: 'Not enough permissions'
          },
          404: {
            description: 'There is no user associated with this id'
          }
        }
      }
    },
    '/api/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'Retrieve a list of organizations',
        parameters: authenticationParams.concat([{
          name: 'ids',
          in: 'query',
          description: 'Unique identifier of organizations to filter',
          required: false,
          schema: {
            type: 'string'
          }
        }, {
          name: 'is-member',
          in: 'query',
          description: 'Filter organizations the user belong to',
          required: false,
          schema: {
            type: 'boolean'
          }
        }]),
        responses: {
          200: {
            description: 'The organizations list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: {
                      type: 'number'
                    },
                    results: {
                      type: 'array',
                      items: organization
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication error'
          }
        }
      }
    }
  }
}
