// Regression guard for C-2 (security-review-2026-04.md):
// before PR #120 (chore: harden SAML), api/src/saml2/service.ts installed
//   samlify.setSchemaValidator({ validate: () => Promise.resolve('skipped') })
// which re-enabled every samlify XML-signature-wrapping CVE because the validator
// itself is the defense layer. If anyone reverts to that no-op shim, the tests
// below must fail loudly.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

// Minimal env bootstrap so `import '#config'` loads the test config without requiring
// the full in-process server setup.
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

test.describe('SAML2 schema validator (C-2 regression)', () => {
  let samlifyCtx: { validate?: (xml: string) => Promise<unknown> }

  test.beforeAll(async () => {
    // Importing the module triggers `samlify.setSchemaValidator(xsdValidator)`.
    await import('../../api/src/saml2/service.ts')
    // samlify's top-level index does not re-export getContext; import it from the
    // CJS submodule where it lives. Brittle-ish, but the path has been stable
    // across samlify 2.x.
    // @ts-ignore -- no declaration file for this submodule
    const { getContext } = await import('samlify/build/src/api.js') as any
    samlifyCtx = getContext()
  })

  test('a validator is wired in', async () => {
    assert.equal(typeof samlifyCtx.validate, 'function')
  })

  test('validator is not the "skipped" no-op shim', async () => {
    // The historical shim resolved every input (including `undefined`) with
    // the literal string 'skipped'. A real validator either rejects on
    // invalid SAML XML, or throws synchronously, or resolves with a
    // different success marker — anything except 'skipped'.
    let result: unknown
    try {
      result = await samlifyCtx.validate!('<not-saml-at-all/>')
    } catch (err) {
      result = err
    }
    assert.notEqual(result, 'skipped',
      'C-2: SAML schema validator has been reverted to the no-op shim — see docs/local/security-review-2026-04.md')
  })

  test('validator rejects garbage (non-XML) input', async () => {
    await assert.rejects(() => samlifyCtx.validate!('this is not xml at all'))
  })

  test('validator rejects well-formed XML that is not a SAML protocol envelope', async () => {
    // Well-formed XML, no SAML namespace, no <saml2p:Response> root — must fail
    // schema validation. Before the fix, the shim silently accepted this.
    await assert.rejects(() => samlifyCtx.validate!(
      '<?xml version="1.0" encoding="UTF-8"?><root xmlns="urn:example"><foo>bar</foo></root>'
    ))
  })

  test('validator rejects a Response whose Assertion carries unexpected child elements (signature-wrapping shape)', async () => {
    // A classic XML-signature-wrapping shape: a <saml2p:Response> root whose
    // <saml2:Assertion> contains a sibling element that is NOT in the SAML
    // assertion schema. samlify's lib would extract attributes from the
    // attacker-supplied element while verifying the signature of the
    // legitimate one. The schema validator is the defense that stops the
    // malformed document at the gate. This XML is deliberately crafted to be
    // well-formed but schema-invalid.
    const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<saml2p:Response xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol"
                 xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
                 ID="_wrap" Version="2.0" IssueInstant="2026-04-21T00:00:00Z">
  <saml2:Issuer>https://evil.example/idp</saml2:Issuer>
  <saml2:Assertion ID="_a" Version="2.0" IssueInstant="2026-04-21T00:00:00Z">
    <saml2:Issuer>https://evil.example/idp</saml2:Issuer>
    <evil:InjectedPayload xmlns:evil="urn:example:evil">admin@victim.com</evil:InjectedPayload>
  </saml2:Assertion>
</saml2p:Response>`
    await assert.rejects(() => samlifyCtx.validate!(wrapped))
  })
})
