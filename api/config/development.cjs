module.exports = {
  mongo: {
    url: 'mongodb://localhost:27017/simple-directory-' + (process.env.NODE_ENV || 'development')
  },
  port: 5690,
  publicUrl: 'http://localhost:5689/simple-directory',
  // use this host when debugging a data-fair inside a virtualbox vm
  // publicUrl: 'http://10.0.2.2:5689',
  admins: ['alban.mouton@koumoul.com', 'alban.mouton@gmail.com', 'superadmin@test.com', 'admin@test.com'],
  adminsOrg: { id: 'admins-org', name: 'Admins organization' },
  admins2FA: false,
  adminCredentials: {
    email: '_superadmin@test.com',
    password: {
      // Test1234
      hash: '657cae4fd3026f325a48ae05da5980e74d4d841e1769ca54f47dc8733dfdd1d7c67196c1bcfc5e3e63b24b8572f6afea7f9347d7dbb489a9e55351a092901b4b',
      salt: 'b8b6f350af7c15fda9f6557fd8bf154a',
      iterations: 100000,
      size: 64,
      alg: 'sha512'
    }
  },
  homePage: 'https://koumoul.com',
  contact: 'contact@test.com',
  anonymousContactForm: true,
  jwtDurations: {
    initialToken: '5m',
    // idToken: '5m',
    // exchangeToken: '5m',
    invitationToken: '5m'
  },
  i18n: {
    // defaultLocale: 'en'
  },
  maildev: {
    active: true
  },
  storage: {
    type: 'mongo',
    // type: 'ldap',
    file: {
      users: './dev/resources/users.json',
      organizations: './dev/resources/organizations.json'
    },
    ldap: {
      url: 'ldap://localhost:389',
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: 'admin',
      members: {
        // organizations arr the parent DC of their users
        organizationAsDC: true,
        // only list users/members with a known role
        onlyWithRole: false,
        role: {
          attr: 'employeeType',
          captureRegex: '^(.{0,3}).*$',
          values: {
            admin: ['adm'],
            user: []
          },
          default: 'user'
        },
        department: {
          attr: 'departmentNumber',
          captureRegex: '^.*/(.*)$'
        },
        // an array of objects that can be used to overwrite member role based on matching "orgId" and "email" properties
        // leave orgId empty to overwrite role for all organizations of the user
        overwrite: []
      },
      organizations: {
        staticSingleOrg: { id: 'static-org', name: 'Static Org' }
      },
      isAdmin: {
        attr: 'employeeType',
        values: ['administrator']
      }
    }
  },
  webhooks: {
    identities: [{ base: 'http://test-koumoul.com/identities', key: 'somesecret' }]
  },
  tosUrl: 'https://test.com',
  manageDepartments: true,
  quotas: {
    defaultMaxCreatedOrgs: 1
    // defaultMaxNbMembers: 0
  },
  passwordless: true,
  userSelfDelete: true,
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
    events: 'secret-events',
    sites: 'secret-sites'
  },
  perOrgStorageTypes: ['ldap'],
  cipherPassword: 'dev',
  privateEventsUrl: 'http://localhost:8088',
  plannedDeletionDelay: 1,
  cleanup: {
    cron: '*/1 * * * *',
    deleteInactive: true,
    deleteInactiveDelay: [1, 'days']
  },
  alwaysAcceptInvitation: true,
  // invitationRedirect: 'http://localhost:5689/test',
  onlyCreateInvited: false,
  singleMembership: true,
  saml2: {
    providers: [{
      title: 'Test SAML IDP',
      color: '#444791',
      icon: 'M21.4 7.5C22.2 8.3 22.2 9.6 21.4 10.3L18.6 13.1L10.8 5.3L13.6 2.5C14.4 1.7 15.7 1.7 16.4 2.5L18.2 4.3L21.2 1.3L22.6 2.7L19.6 5.7L21.4 7.5M15.6 13.3L14.2 11.9L11.4 14.7L9.3 12.6L12.1 9.8L10.7 8.4L7.9 11.2L6.4 9.8L3.6 12.6C2.8 13.4 2.8 14.7 3.6 15.4L5.4 17.2L1.4 21.2L2.8 22.6L6.8 18.6L8.6 20.4C9.4 21.2 10.7 21.2 11.4 20.4L14.2 17.6L12.8 16.2L15.6 13.3Z',
      /* redirectMode: {
        type: 'always'
      }, */
      metadata: `<?xml version="1.0"?>
      <md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="http://localhost:8080/simplesaml/saml2/idp/metadata.php">
        <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
          <md:KeyDescriptor use="signing">
            <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
              <ds:X509Data>
                <ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
          </md:KeyDescriptor>
          <md:KeyDescriptor use="encryption">
            <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
              <ds:X509Data>
                <ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
          </md:KeyDescriptor>
          <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php"/>
          <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
          <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://localhost:8080/simplesaml/saml2/idp/SSOService.php"/>
        </md:IDPSSODescriptor>
      </md:EntityDescriptor>`
      // loginUrl: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php',
      // logoutUrl: 'http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php',
      // see http://localhost:8080/simplesaml/saml2/idp/metadata.php?output=xhtml
      // certificates: ['MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==']
    }]
  },
  oidc: {
    // WARNING: does not work on a recent chrome
    // this provider tries to use a cookie with samesite=none option and this is not permitted without https
    providers: [{
      title: 'Test OIDC IDP',
      color: '#D92929',
      img: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      discovery: 'http://localhost:9009/.well-known/openid-configuration',
      client: {
        id: 'foo',
        secret: 'bar'
      }
    },
    {
      /* Instructions to create the keycloak test client
        - login to keycloak (localhost:8888, admin/admin)
        - section "Clients" > "Create"
        - Client type: OpenID Connect
        - Client ID: test-sd
        - Name: test SD
        - Client authentication: On
        - Authorization: On
        - Authentication flow: Standard flow
        - Root URL: http://localhost:5689
        - Valid Redirect URIs: http://localhost:5689/simple-directory/api/auth/oauth-callback
        - Front channel logout: Off
        - Backchannel logout session required : On
        - Backchannel logout URL: http://localhost:5689/simple-directory/api/auth/oauth-logout
        - > Create
        - section "Advanced"
        - Access Token Lifespan: short value for tests
        - Client Session Idle and Client Session Max: longer to allow for refreshing tokens on keepalive
        - section "Credentials", get the secret and write it here in client.secret
        - section "Realm Settings" > "General" > "Endpoints", get OIDC configuration URL and write it here in discovery

        - section "Users" > "Add user" then "Credentials"

      */
      title: 'Test OIDC Keycloak',
      color: '#D92929',
      img: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Keycloak_Logo.png',
      discovery: 'http://localhost:8888/realms/master/.well-known/openid-configuration',
      client: {
        id: 'test-sd',
        secret: 'F652euPulSE7WKUgAc5YBbsnzdxFFlgf'
      },
      coreIdProvider: true,
      ignoreEmailVerified: true,
      /* redirectMode: {
        type: 'always'
      }, */
      createMember: {
        type: 'always'
      },
      memberRole: {
        type: 'static',
        role: 'admin'
      }
    }
    ]
  },
  manageSites: true,
  managePartners: true,
  defaultOrg: 'admins-org',
  serveUi: false,
  passwordValidation: {
    // entropy: 50,
    entropy: 20,
    // minLength: 8,
    // minCharClasses: 3,
  },
  siteOrgs: true,
  siteAdmin: true
}
