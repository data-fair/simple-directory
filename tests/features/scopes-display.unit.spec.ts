import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { collapseScopes } from '../../shared/scopes.ts'

test.describe('dense display of scopes', () => {
  test('all:admin alone replaces every scope it implies', () => {
    assert.deepEqual(collapseScopes(['datasets:read', 'all:read', 'all:admin', 'organizations:write', 'all:write']), ['all:admin'])
  })

  test('a global tier hides the same or lower tiers only', () => {
    assert.deepEqual(collapseScopes(['all:read', 'datasets:read', 'datasets:write']), ['all:read', 'datasets:write'])
  })

  test('an umbrella hides the tiers of its family, not the global ones', () => {
    assert.deepEqual(collapseScopes(['datasets', 'datasets:admin', 'datasets:read', 'all:read']), ['datasets', 'all:read'])
    // nor is an umbrella hidden by a global tier scope
    assert.deepEqual(collapseScopes(['all:admin', 'datasets']), ['all:admin', 'datasets'])
  })

  test('a higher tier of a family hides the lower ones of the same family', () => {
    assert.deepEqual(collapseScopes(['datasets:read', 'datasets:write', 'organizations:read']), ['datasets:write', 'organizations:read'])
  })

  test('unknown tiers and duplicates', () => {
    assert.deepEqual(collapseScopes(['datasets:custom', 'datasets:custom', 'all:admin']), ['datasets:custom', 'all:admin'])
    assert.deepEqual(collapseScopes([]), [])
  })
})
