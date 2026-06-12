import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { inflateRawSync } from 'node:zlib'

// Minimal env bootstrap so `import '#config'` loads the test config without requiring
// the full in-process server setup (same pattern as saml2-schema-validator.unit.spec.ts).
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const idpMetadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test/metadata">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" WantAuthnRequestsSigned="false">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.test/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>`

// the SAMLRequest query param of a redirect-binding URL is base64(deflate-raw(xml))
const decodeSamlRequest = (loginRequestUrl: string) => {
  const samlRequest = new URL(loginRequestUrl).searchParams.get('SAMLRequest')
  assert.ok(samlRequest)
  return inflateRawSync(Buffer.from(samlRequest, 'base64')).toString()
}

test.describe('SAML2 ForceAuthn on adminMode logins', () => {
  test('adminMode requests carry ForceAuthn="true", normal requests do not', async () => {
    const samlify = (await import('samlify')).default
    const { createForceAuthnTagReplacement, forceAuthnLoginRequestTemplate } = await import('../../api/src/saml2/service.ts')

    const idp = samlify.IdentityProvider({ metadata: idpMetadata })
    const sp = samlify.ServiceProvider({
      entityID: 'https://sd.test/api/auth/saml2-metadata.xml',
      assertionConsumerService: [{
        Binding: samlify.Constants.namespace.binding.post,
        Location: 'https://sd.test/api/auth/saml2-assert'
      }],
      // @ts-ignore same string-typed value as in initServiceProvider
      allowCreate: 'false',
      loginRequestTemplate: { context: forceAuthnLoginRequestTemplate }
    })

    // normal login: default samlify path, no ForceAuthn
    const normal = sp.createLoginRequest(idp, 'redirect')
    const normalXml = decodeSamlRequest(normal.context)
    assert.ok(!normalXml.includes('ForceAuthn'))

    // adminMode login: custom template path with ForceAuthn
    const admin = sp.createLoginRequest(idp, 'redirect', createForceAuthnTagReplacement(sp, idp))
    const adminXml = decodeSamlRequest(admin.context)
    assert.ok(adminXml.includes('ForceAuthn="true"'))
    assert.ok(!adminXml.includes('{'), `unreplaced template tags in: ${adminXml}`)
    assert.ok(adminXml.includes('Destination="https://idp.test/sso"'))
    assert.ok(adminXml.includes('AssertionConsumerServiceURL="https://sd.test/api/auth/saml2-assert"'))
  })
})
