import neostandard from 'neostandard'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

export default [
  { ignores: ['ui/*', '**/.type/', 'dev/*', 'node_modules/*'] },
  ...dfLibRecommended,
  ...neostandard({ ts: true }),
  {
    // server code logs through @data-fair/lib-node/log.js, see docs/architecture/logging.md
    files: ['api/src/**/*.ts', 'api/src/**/*.js', 'api/index.ts'],
    rules: { 'no-console': 'error' }
  }
]
