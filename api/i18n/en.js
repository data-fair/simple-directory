// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Easy users and organizations management for modern Web-oriented architectures.'
  },
  common: {
    manageNotifications: 'Manage notifications',
    home: 'Home',
    logLink: 'Log in / sign up',
    logout: 'Log out',
    login: 'Log in',
    signin: 'Sign up',
    activateAdminMode: 'Activate admin mode',
    deactivateAdminMode: 'Deactivate admin mode',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'Personal info',
    myOrganizations: 'My organizations',
    organization: 'Organization',
    organizations: 'Organizations',
    organizationName: 'Organization name',
    user: 'User',
    users: 'Users',
    createOrganization: 'Create organization',
    dashboard: 'Dashboard',
    description: 'Description',
    id: 'Identifier',
    name: 'Name',
    save: 'Save',
    send: 'Send',
    load: 'Upload',
    active: 'Active',
    inactive: 'Inactive',
    members: 'Members',
    orgStorageMembers: 'Members in secondary storage',
    role: 'Role',
    search: 'Search',
    noResult: 'No result',
    confirmOk: 'Ok',
    confirmCancel: 'Cancel',
    confirmTitle: 'Do you want to confirm this operation?',
    firstName: 'First name',
    lastName: 'Family name',
    email: 'Email',
    modificationOk: 'Your modification was saved.',
    invitations: 'Invitations',
    accept: 'Accept',
    reject: 'Reject',
    confirmDeleteTitle: 'Delete {name}',
    confirmDeleteMsg: 'Do you really want to delete this resource? Data will not be recoverable.',
    editTitle: 'Edit {name}',
    seeTitle: 'View {name}',
    loggedAt: 'Last login',
    createdAt: 'Created on',
    createdPhrase: 'Created by {name} on {date}',
    host: 'Site',
    sites: 'Sites',
    updatedAt: 'Updated on',
    maxCreatedOrgs: 'Maximum number of organizations to create',
    maxCreatedOrgsShort: 'Max orgs',
    unlimited: 'unlimited',
    nbCreatedOrgs: 'Number of organizations created:',
    maxCreatedOrgsValue: 'Maximum number of organizations to create: {value}',
    back: 'Back',
    next: 'Next',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    passwordShown: 'Your password is visible',
    passwordHidden: 'Your password is hidden',
    checkInbox: 'Check your mailbox',
    spamWarning: 'If you didn\'t receive an email, check whether it was classified as spam in your mailbox.',
    validate: 'Validate',
    delete: 'Delete',
    department: 'Department',
    departments: 'Departments',
    autoAdmin: 'Automatically add me as admin',
    asAdmin: 'Log in as this user',
    transfer: 'Transfer to another site',
    delAsAdmin: 'Get back to your normal session',
    avatar: 'Avatar',
    birthday: 'Birthday',
    missingInfo: 'Missing info',
    '2FA': 'Two-factor authentication',
    userAccount: 'Personal account',
    continue: 'Continue',
    tooLong: 'Text is too long',
    settings: 'settings',
    emailConfirmed: 'Creation finalized',
    emailNotConfirmed: 'Creation not finalized',
    noRole: 'no role',
    downloadCsv: 'Download the list in CSV format',
    authMode: 'Authentication mode',
    authProviders: 'Authentication providers',
    partners: 'Partner organizations',
    contactEmail: 'Contact email',
    orgName: 'Name of the organization',
    loginSignin: 'Log in / create an account',
    sort: 'Sort',
    all: 'all',
    creationStep: 'Creation step',
    oauthTokens: 'OAuth tokens',
    plannedDeletion: 'Planned deletion',
    plannedDeletionShort: 'Deletion',
    owner: 'Owner',
    passwordLists: 'Passwords',
    adminGlobal: 'Global administration',
    adminSite: 'Site administration',
    no: 'No',
    yes: 'Yes',
    redirectSite: 'Redirect site',
    manageOrg: 'Organization management',
    manageDep: 'Department management'
  },
  doc: {
    about: {
      link: 'About'
    },
    install: {
      link: 'Install'
    },
    config: {
      link: 'Configuration',
      i18nKey: 'Key in I18N file',
      i18nVar: 'Environment variable',
      i18nVal: 'Value',
      varKey: 'Key in the configuration file',
      varName: 'Environment variable',
      varDesc: 'Description',
      varDefault: 'Default value',
      varDescriptions: {
        publicUrl: '<b>IMPORTANT.</b> The URL where the service will be exposed. For example https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANT.</b> The list of email addresses of the administrators of this service.',
        contact: '<b>IMPORTANT.</b> The contact email address for the users of the service.',
        theme: {
          logo: 'The URL to replace Simple Directory\'s default logo.',
          dark: 'Switch the whole appearance of pages to a dark style.<br>Note that the default colors are better suited to a light style: if you switch to dark, you will have to modify them too.',
          cssUrl: 'Link to a stylesheet to complement the branding variables.<br>WARNING: the HTML structure can change from one version to another. Maintaining an external stylesheet is going to create extra work for you on upgrades.',
          cssText: 'Raw CSS content to complement the branding variables.<br>WARNING: the HTML structure can change from one version to another. Maintaining an external stylesheet is going to create extra work for you on upgrades.'
        },
        secret: {
          public: '<b>IMPORTANT.</b> The path to the public RSA signing key. See the install doc of the service.',
          private: '<b>IMPORTANT.</b> The path to the private RSA signing key. See the install doc of the service.'
        },
        storage: {
          type: `<b>IMPORTANT.</b> The type of storage for persisting users and organizations.<br>
The default type "file" is read-only and suited for development/test or to use data exported from another system.<br>
The type "mongo" depends on accessing a MongoDB instance, it is the appropriate choice for most production deployments.`,
          file: {
            users: 'Only for storage.type=file. The path to the JSON file containing user definitions',
            organizations: 'Only for storage.type=file. The path to the JSON file containing organization definitions'
          },
          mongo: {
            url: 'Only for storage.type=mongo. The full connection string for the MongoDB database.'
          }
        },
        mails: {
          transport: '<b>IMPORTANT.</b> A JSON object of configuration for the email transport compatible with the library <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANT.</b> The address to use as sender for emails sent by the service.'
        },
        listEntitiesMode: `Used to globally restrict access to the lists of users and organizations.<br>
Can be 'anonymous', 'authenticated' or 'admin'.`,
        defaultLoginRedirect: 'Default redirection after login. If not specified, the user is redirected to their profile page.',
        onlyCreateInvited: 'If true, users are not created when the first email is sent. They must be invited into an organization.',
        tosUrl: '<b>IMPORTANT.</b> The URL of your terms of service. If this parameter is empty or does not link to a proper Web page, you risk not meeting your obligations toward your users.'
      }
    },
    use: {
      link: 'Use'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Users can create an unlimited number of organizations.',
        createdOrgsLimit: 'Users can create {defaultMaxCreatedOrgs} organization(s) by default.',
        explainLimit: 'Define a value to limit the number of organizations the user can create. -1 for an unlimited number. Empty the field to fall back on the default value ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Change the email address of the user {name}',
        editUserEmailText: 'Warning! The email is an important key of the user: by modifying it, you run the risk of inserting an address that is incorrect, non-functional or inconsistent with other entries. This feature is only presented to administrators to unblock a user whose mailbox becomes inaccessible.',
        drop2FATitle: 'Reset the two-factor authentication of the user {name}',
        transferTitle: 'Transfer the user {name} to another site',
        transferText: 'The user will be attached to the selected site. Their SSO identities are reset and they keep their organization memberships. Super administrator accounts cannot be transferred.',
        transferTargetSite: 'Target site',
        transferMainSite: 'Main site',
        drop2FAExplain: 'Warning! This operation is reserved for unlocking a user who has lost both their device and recovery code for two-factor authentication. Before continuing, it is strongly recommended to verify the identity of the person making the request in some way (for example, by contacting a colleague in the same organization).'
      },
      organizations: {
        limitOrganizationTitle: 'Edit the limits of the organization',
        members: 'member(s)',
        nbMembers: 'Maximum number of members (0 for no limit)',
        fromCache: 'Last synchronization of this list with the identity provider: '
      },
      sites: {
        createSite: 'Define a new site',
        loginOnSite: 'Sign in on the site',
        colorWarnings: 'Contrast warnings',
        mainSite: 'Main site',
      },
      passwordLists: {
        help1: 'You can upload password lists from CSV files. These well-known passwords will then be rejected if users try to use them.',
        help2: 'You can find password list files on the internet, for example on the {secLists} project or the {richelieu} project for a French list.',
        newFile: 'New password file (one password per line)',
        subtitle: '{state} - {date} - {count} passwords',
        confirmDelete: 'Delete this password list?'
      },
      site: {
        title: 'Site configuration',
        oidcHelp: 'Give this login callback URL ({url}) to the identity provider and set the scopes "openid", "profile", "email".',
        samlHelp: 'Fill in the field below with the XML metadata provided by the identity provider, and give it this {link} in return.',
        samlHelpLink: 'link',
        mainSiteExplanation: 'This site matches this service\'s main domain. Its database document drives presentation only, and only for the categories listed in MAIN_SITE_FROM_DB. Authentication, identity providers and account scoping always come from environment variables.'
      }
    },
    contact: {
      title: 'Contact us',
      from: 'Your email address',
      subject: 'Subject',
      text: 'Your request',
      sent: 'Your request has been sent'
    },
    login: {
      title: 'Identify yourself',
      emailLabel: 'Your email address',
      success: 'You will receive an email at the specified address. Please use the link in this email to complete your identification.',
      maildevLink: 'Open the development mailbox',
      newPassword: 'New password',
      newPassword2: 'Confirm new password',
      changePassword: 'Renew the password',
      changePasswordTooltip: 'In case you forgot your password or if you need to change it, renew your password.',
      newPasswordMsg: 'Type the new password twice.',
      changePasswordSent: 'An email was sent to the address {email}. This email contains a link to change the password of your account.',
      passwordlessMsg1: 'To log in, an email is enough.',
      passwordlessMsg2: 'Send a login email.',
      passwordlessConfirmed: 'An email was sent to the address {email}. This email contains a link to log in to the platform.',
      createUserMsg1: 'If you have never logged in to our platform, please create an account.',
      createUserMsg2: 'Create an account',
      createUserInvit: 'Create an account to accept the invitation to the organization {name}',
      createUserOrganization: 'Do you want to create an organization?',
      createUserOrganizationHelp: 'If you create an organization you will be able to invite other users to join you and share resources.',
      tosMsg: 'Before creating an account please read <a href="{tosUrl}" target="_blank">our terms of service</a>.',
      tosConfirm: 'I confirm that I have read the terms of service of this site.',
      createUserConfirm: 'Create the account',
      createUserConfirmed: 'An email was sent to the address {email}. This email contains a link to validate the creation of your account.',
      adminMode: 'Confirm your identity to switch to admin mode.',
      adminModePromptTitle: 'Admin mode',
      adminModePromptMsg: 'Your account is a super-administrator account. Do you want to activate admin mode for this session?',
      adminModePromptAccept: 'Admin mode',
      adminModePromptDecline: 'Normal session',
      oauth: 'Connect with:',
      error: 'Error',
      rememberMe: 'Remember me',
      '2FACode': '6-digit code or recovery code',
      '2FAInfo': 'Enter a verification code to continue. You can get this code from the verification app on your phone. If you lose your device, you can use the recovery code downloaded when setting up two-factor authentication.',
      configure2FA: 'Configure two-factor authentication',
      configure2FAQRCode: 'Two-factor authentication setup QR code',
      configure2FAQRCodeMsg: 'Scan this QR code with an authentication tool of your choice (like Authy or Google Authenticator) then enter the 6-digit code offered by this application.',
      configure2FACode: '6-digit code',
      recovery2FA: 'Recovery code',
      recovery2FAInfo: 'Caution! Keep the recovery code below in a safe place. Without it, you won\'t be able to recover your account if you lose the device on which you just set up two-factor authentication.',
      recovery2FACode: 'Recovery code: ',
      recovery2FADownload: 'Download a file containing the recovery code',
      recovery2FAContent: 'Recovery code for two-factor authentication {name}',
      plannedDeletion: 'Planned deletion',
      cancelDeletion: 'Cancel the deletion of the user',
      siteLogo: 'Site logo',
      partnerInvitation: 'Partner invitation',
      changeHost: 'Account associated with the back-office'
    },
    siteAdmin: {
      account: 'Account',
      '2FAActive': 'Two-factor authentication active',
      plannedDeletion: 'Deletion planned on {date}',
      cancelDeletion: 'Cancel the planned deletion of {name}',
      revokeSessions: 'Log {name} out of all their sessions',
      confirmRevokeSessionsMsg: 'All the sessions of this user will be closed. Pages that are already open stay usable for a few minutes, until their session token needs to be renewed.',
      confirmDeleteMsg: 'The account {email} will be deleted permanently, and removed from all the organizations it belongs to.'
    },
    oauthConsent: {
      title: '{client} wants to access your account',
      willBeAble: 'This application will be able to:',
      redirectHost: 'You will then be sent back to {host}.',
      account: 'Account to use',
      personalAccount: 'Personal account',
      organizationAccount: 'Organization',
      allow: 'Allow',
      deny: 'Deny',
      broadScope: 'Broad access',
      unverifiedTitle: 'Unverified application',
      unverifiedCimd: '{client} is not a verified application. It identified itself with the address {url}; nobody checked it.',
      unverifiedDcr: '{client} is not a verified application. It was registered automatically; nobody checked its identity.',
      resourceMcp: 'It requests access to the MCP server of this platform.',
      resourceApi: 'It requests access to the API of this platform.',
      noOrganization: 'You are not an administrator of an organization that can authorize this application.',
      organization: 'Organization',
      nhi: 'Identity of the application',
      nhiHint: 'The service accounts of the organization, managed by its administrators on the organization page.',
      noNhi: 'This organization has no service account this application can use (one whose scopes cover at least one of the requested permissions). Service accounts are managed by administrators on the organization page.',
      manageNhis: 'Manage the service accounts',
      permissions: 'Permissions granted',
      lifetime: 'Duration of the authorization',
      lifetime1d: '1 day',
      lifetime7d: '7 days',
      lifetime30d: '30 days',
      lifetime90d: '90 days',
      lifetime1y: '1 year',
      errorTitle: 'Authorization impossible',
      errors: {
        interactionExpired: 'The authorization request has expired or was already handled. Go back to the application and try again.',
        unauthorized: 'Your session has expired or you are not logged in. Log in again, then start over from the application.',
        forbidden: 'Your session cannot grant this authorization.',
        generic: 'The authorization request failed (code: {code}).'
      }
    },
    organization: {
      addMember: 'Invite a user to join this organization',
      disableInvite: 'This organization already contains its maximum number of members.',
      deleteMember: 'Delete this user from the list of members',
      editMember: 'Change the role of this user in the organization',
      memberReadOnly: 'This user\'s membership in the organization comes from an identity provider and cannot be modified here.',
      confirmEditMemberTitle: 'Change {name}',
      confirmDeleteMemberTitle: 'Exclude {name}',
      confirmDeleteMemberMsg: 'Do you really want to delete this user from the list of members of the organization {org}?',
      deleteMemberSelfWarning: 'This is your own membership: you may lose access to this organization and its resources, and you will not be able to undo this change yourself.',
      editMemberSelfWarning: 'You are changing your own role: you may lose your administration rights on this organization, and you will not be able to undo this change yourself.',
      deleteMemberLastAdmin: 'You are the last administrator of this organization: appoint another administrator before leaving it.',
      deleteMemberLastMember: 'You are the last member of this organization and cannot leave it. If it is no longer used, it must be deleted.',
      editMemberLastAdmin: 'You are the last administrator of this organization: appoint another administrator before changing your role.',
      deleteMemberSuccess: 'The user {name} was excluded from the organization',
      inviteEmail: 'Email address of the user',
      inviteSuccess: 'An invitation has been sent to the address {email}',
      invitePartnerSuccess: 'An invitation has been sent to the address {email}',
      memberConflict: 'This user is already a member',
      departmentLabelTitle: 'Label for the concept "department"',
      departmentLabelHelp: 'Leave empty to display "{defaultDepartmentLabel}". Fill in to use another vocabulary like "service", "agency", etc.',
      addDepartment: 'Create {departmentLabel}',
      editDepartment: 'Edit {departmentLabel}',
      deleteDepartment: 'Delete {departmentLabel}',
      confirmEditDepartmentTitle: 'Edit {name}',
      confirmDeleteDepartmentTitle: 'Delete {name}',
      confirmDeleteDepartmentMsg: 'Are you sure you want to delete {name} from your organization?',
      deleteDepartmentHasMembers: 'This department is assigned to {count} member of the organization. You can\'t delete it in this state. | This department is assigned to {count} members of the organization. You can\'t delete it in this state.',
      departmentIdInvalid: 'The identifier must contain only letters, digits and spaces.',
      inviteLink: 'If there is a problem with the email communication, you can send the confirmation link below by another means. Warning! You risk inserting an incorrect or non-functional email address in the user database. This email address may cause multiple problems later: change of password, sending alerts, etc.',
      '2FARoles': 'Two-factor authentication.',
      '2FARolesMsg': 'Make two-factor authentication mandatory for users with these roles:',
      sendInvitationLink: 'Send another invitation link',
      addPartner: 'Invite a partner organization',
      deletePartner: 'Delete this partner',
      depSortCreation: 'Last created',
      depSortAlpha: 'Alphabetical order',
      deletePartnerWarning: 'Permissions granted to this organization on your resources will be withdrawn.',
      partnerInvitationExpired: 'invitation expired',
      partnersQuotaHelp: 'Pending invitations count in the quota, except the expired ones.',
      partnersQuotaPending: '{count} pending invitation takes a slot: delete it to free the slot, or wait for it to expire. | {count} pending invitations take a slot: delete one to free it, or wait for it to expire.',
      fromCache: 'Last synchronization of this list with the identity provider: {fromNow}.',
      roleLabel: 'Label for the role "{role}"',
      infoTitle: 'Information',
      siteUsersTitle: 'Accounts of the site',
      siteUsersHelp: 'Accounts created on this site, the main site of the organization. As an administrator of the organization you can reset their two-factor authentication, cancel a planned deletion, close their sessions or delete them.',
      nhisTitle: 'Service accounts (non-human identities)',
      nhisHelp: 'Service accounts are the non-human identities of the organization. They authenticate with a token issued by a trusted identity provider (for example a Kubernetes cluster), or act as the identity of the OAuth applications (for example an AI agent) an administrator connects to them. They have no email and their sessions are short-lived.',
      addNhi: 'Create a service account',
      editNhi: 'Edit the service account',
      deleteNhi: 'Delete the service account',
      confirmDeleteNhiTitle: 'Delete the service account {name}',
      confirmDeleteNhiMsg: 'Do you really want to delete this service account? Ongoing tokens will stop working once they expire.',
      nhiIssuer: 'Token issuer',
      nhiSubject: 'Subject',
      nhiKeyBindingHint: 'Leave the issuer and the subject empty for a service account used by OAuth applications only.',
      nhiOauthOnly: 'OAuth connections only',
      nhiConnections: 'OAuth connections',
      nhiConnectionsCount: '{count} connection | {count} connections',
      nhiConnectionLastUsed: 'last used on {date}',
      nhiConnectionNeverUsed: 'never used',
      nhiConnectionExpires: 'expires on {date}',
      revokeNhiConnections: 'Revoke the connections',
      revokeNhiConnectionsTitle: 'Revoke the connections of {name}',
      revokeNhiConnectionsWarning: 'The client will no longer be able to act as this service account. Access tokens already issued stay valid for up to {duration}.',
      nhiAllowedIps: 'Allowed addresses (optional)',
      nhiAllowedIpsHint: 'Addresses or CIDR subnets the token exchange is accepted from, for example 203.0.113.5 or 10.4.0.0/16. Leave empty to accept any address.',
      nhiIpBinding: 'Bind the session to the address it was obtained from',
      nhiIpBindingHint: 'A leaked token becomes unusable from anywhere else. Only enable it if this service account always calls from a stable address: a changing egress address (NAT pool, dual-stack) would break its sessions.',
      nhiScopes: 'Scopes (optional)',
      nhiScopesHint: 'The permissions of this service account, for example datasets:read or datasets. Leave empty for an unrestricted account acting with the full rights of its role.',
      nhiUnrestricted: 'Unrestricted access (full rights of its role)',
      nhiJwks: 'JWKS (optional, if the provider is not publicly reachable)',
      nhiClientId: 'Client identifier (client_id)',
      nhiJwksInvalid: 'Invalid JSON for the JWKS: {message}'
    },
    invitation: {
      title: 'Invitation validated',
      msgSameUser: 'Your invitation to become a member of an organization has been validated. You can visit <a href="{profileUrl}">your profile</a>.',
      msgDifferentUser: 'This invitation to become a member of an organization has been validated. You can <a href="{loginUrl}">log in</a> with the invited account.'
    },
    avatar: {
      changeUser: 'Change your account avatar',
      changeOrganization: 'Change the organization avatar',
      changeDepartment: 'Change the avatar of "{departmentName}"',
      reset: 'Restore the default avatar'
    },
    me: {
      emailNotEditable: 'This address cannot be changed.',
      noOrganization: 'You are not a member of any organization.',
      operations: 'Sensitive operations',
      deleteMyself: 'Delete this account',
      deleteMyselfAlert: 'If you delete your account, you will have {plannedDeletionDelay} days to cancel the operation, after which all associated data will be deleted and will not be recoverable.',
      deleteMyselfCheck: 'Check this box and click OK to confirm the deletion of the user {name} and all their data.',
      accountChanges: 'Managing account switching',
      defaultOrg: 'Activate this account by default after each login',
      ignorePersonalAccount: 'Check this box if you do not wish to use this platform outside of an organization account',
      sessions: 'Your sessions',
      deleteSession: 'Delete the session on {deviceName}?',
      deleteSessionWarning: 'Deleting a session may take up to {duration} to be fully applied.',
      settings: 'Your settings',
      connectedApplications: 'Connected applications',
      revokeApplication: 'Revoke access',
      revokeApplicationTitle: 'Revoke the access of {name}?',
      revokeApplicationWarning: 'The application will no longer be able to use your account. Access tokens already issued stay valid for up to {duration}.',
      applicationGrantedOn: 'Authorized on {date}',
      applicationLastUsed: 'last used on {date}',
      applicationNeverUsed: 'never used',
      applicationExpires: 'expires on {date}',
      applicationPersonalAccount: 'Personal account'
    },
    colorsPreview: {
      title: 'Preview of color rendering',
      cardTitle: 'An example card',
      cardText: 'It uses the color of "surfaces".'
    },
    partnerInvitation: {
      msg1: 'The organization {name} wants to add {partnerName} as a partner with {email} as contact address.',
      msg2: 'The name "{partnerName}" is indicative and does not necessarily correspond to your organization\'s exact name.',
      diffEmail: 'You are logged in with the user account {userName} ({userEmail}). You can log in with another account or create a new account by clicking the button below.',
      noUser1: 'Already have an account? You can log in and will be redirected to this page afterward.',
      noUser2: 'Don\'t have an account yet? You can create one and will be redirected to this page afterward.',
      noOrg: 'You are not a member of any organization. You can create a new organization and accept the invitation on its behalf.',
      org: 'You can accept this invitation on behalf of an organization you administer, or create a new organization and accept the invitation on its behalf.',
      createOrg: 'Create a new organization',
      newOrgName: 'Name of the new organization',
      create: 'Create',
      acceptAs: 'Accept on behalf of {name}'
    },
    changeHost: {
      msg1: 'The account {email} does not exist on {host} but exists on {mainHost}.',
      sso1: 'Solution: use {mainHost} to log in',
      sso2: 'The login page offers a button to log in from {mainHost} that you can use. You can also use <a class="text-primary" href="{mainHostLogin}">this link</a>.',
      solution1: 'Solution: move the account to {host}',
      solution2: 'If you choose this solution, you will lose the ability to log in to {mainHost}.',
      confirmMigration: 'Move the account to {host} and lose access to {mainHost}'
    },
    orgStorage: {
      activate: 'Activate secondary user storage',
      link: 'Connection link to use this secondary storage',
      ldap: 'LDAP configuration'
    }
  },
  errors: {
    badEmail: 'Email address is empty or malformed.',
    badProviderInvitEmail: 'The email address you just used to log in does not match the one from the invitation you received',
    maxCreatedOrgs: 'The user cannot create more organizations. Limit reached.',
    permissionDenied: 'Insufficient permissions.',
    nonEmptyOrganization: 'You must remove other members from this organization',
    userUnknown: 'Unknown user.',
    orgaUnknown: 'Unknown organization.',
    invitationConflict: 'This user is already a member of the organization.',
    unknownRole: 'Role {role} is unknown.',
    serviceUnavailable: 'Service unavailable because of maintenance.',
    badCredentials: 'Invalid email address or password.',
    updatePassword: 'You need to update your password, because it has not been changed for too long, in accordance with our security policies.',
    missingToken: 'The id_token parameter is missing.',
    invalidToken: 'The token is not valid. It may have expired.',
    differentPasswords: 'The passwords are different',
    noPasswordless: 'Passwordless authentication is not accepted by this service.',
    rateLimitAuth: 'Too many attempts in a short interval. Please wait before trying again.',
    invalidInvitationToken: 'The invitation link you received is invalid.',
    expiredInvitationToken: 'The invitation link you received has expired, you can no longer accept this invitation.',
    maxNbMembers: 'The organization already contains the maximum number of members allowed by its quotas.',
    maxNbDepartments: 'The organization already contains the maximum number of departments allowed by its quotas.',
    maxNbPartners: 'The organization already has the maximum number of partners allowed by its quotas, unexpired pending invitations included.',
    unknownOAuthProvider: 'OAuth identification not supported.',
    unknownSAMLProvider: 'SAML identification not supported.',
    adminModeOnly: 'Feature reserved for super administrators.',
    adminChangeHostBlocked: 'Super administrators cannot transfer their account to a secondary site. Sign in from the main site.',
    emailNotConfirmed: 'Your email address has not been confirmed yet. A new confirmation link has just been sent to you, open it to activate your account.',
    '2FANotConfigured': 'Two-factor authentication is required for this account and is not yet configured.',
    passwordless2FA: 'Passwordless authentication is incompatible with the two-factor authentication required for this account.',
    bad2FAToken: 'Invalid or expired verification code for two-factor authentication',
    plannedDeletion: 'The deletion of the user {name} and all their data is planned on {plannedDeletion}.',
    onlyCreateInvited: 'You cannot create an account directly. You must be invited by an organization.',
    badIDPQuery: 'Request considered invalid by the identity provider.',
    badIDPResponse: 'Invalid response from the identity provider, please try to log in again.',
    duplicateDep: 'The new department is a duplicate',
    passwordEntropy: 'The password is not strong enough.',
    passwordMinLength: 'The password must contain at least {minLength} characters.',
    passwordMinCharClasses: 'The password must contain at least {minCharClasses} different types of characters (lowercase, uppercase, digit, special character).',
    forbiddenPassword: 'This password was found in a list of known passwords and cannot be used.',
    samePassword: 'The new password must be different from the old one.',
    conflict2FA: 'Two-factor authentication is already configured for this account.',
    oauthNoEmail: 'Login refused: the identity provider did not send any email address.',
    oauthEmailNotVerified: 'Login refused: the identity provider does not report this email address as verified.',
    githubNoVerifiedEmail: 'Login refused: no verified primary email address was found on the GitHub account.',
    facebookDisabled: 'Logging in with Facebook is disabled: Facebook does not tell whether the email address was verified.',
    partnerInvitationMismatch: 'This request does not match the invitation that was sent.',
    partnerConflict: 'This organization is already a partner.',
    noPendingPartnerInvitation: 'No invitation is pending validation.',
    memberOfParentOrg: 'This user is a member of the parent organization, they cannot be added to a department.',
    memberOfDepartment: 'This user is a member of a department, they cannot be added to the parent organization.',
    departmentUnknown: 'Unknown department.',
    unknownOrgRole: 'Role {role} is unknown in the organization {org}.',
    missingDepartmentAttribute: 'The identity provider did not send the department attribute, which is required.',
    otherCoreIdProvider: 'This user is already linked to another main identity provider.',
    authOnlyOtherSiteChain: 'The site {host} cannot be used as the authentication reference: it is also configured to authenticate on another site only.',
    spamSuspected: 'Message refused: the activity looks like that of a spam bot.',
    rateLimitMessages: 'Too many messages in a short interval. Please wait before trying again.'
  },
  mails: {
    // the message forwarded by the contact form
    contact: {
      intro: 'Message sent through the contact form of {site} by {from}'
    },
    creation: {
      subject: 'Welcome to {host}',
      text: `
An account creation request was made from {host}. To activate the account, you must copy the URL below into the address bar of your Web browser. This URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you didn't submit this identification request to {host}, feel free to contact us at {contact}.
      `,
      htmlMsg: 'An account creation request was made from <a href="{origin}">{host}</a>. To activate the account, click the button below. This link is valid for 15 minutes.',
      htmlButton: 'Validate the account creation',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you didn\'t submit this identification request to <a href="{origin}">{host}</a>, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identification on {host}',
      text: `
An identification request was made from {host}. To confirm, copy the URL below into the address bar of your Web browser. This URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you didn't submit this identification request to {host}, feel free to contact us at {contact}.
      `,
      htmlMsg: 'An identification request was made from <a href="{origin}">{host}</a>. To confirm, click the button below. This link is valid for 15 minutes.',
      htmlButton: 'Log in to {host}',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you didn\'t submit this identification request to <a href="{origin}">{host}</a>, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Authentication failure on {host}',
      text: `
An identification request was made from {host}, but it was rejected as this email address is unknown.

Feel free to contact us at {contact}.
      `,
      htmlMsg: 'An identification request was made from <a href="{origin}">{host}</a>, but it was rejected as this email address is unknown.',
      htmlCaption: 'Feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Failure to create an account on {host}',
      text: `
An account creation request was made from {host}, but it was rejected as this email address is already associated with an account.

Feel free to contact us at {contact}.
      `,
      htmlMsg: 'An account creation request was made from <a href="{origin}">{host}</a>, but it was rejected as this email address is already associated with an account.',
      htmlCaption: 'Feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Join the organization {organization} on {host}',
      text: `
An administrator from the organization {organization} invited you to join it. To accept this invitation, copy the URL below into the address bar of your Web browser. This URL is valid for 10 days.

{link}

If you encounter a problem with your account or if you find this invitation suspicious, feel free to contact us at {contact}.
      `,
      htmlMsg: `
      An administrator from the organization {organization} invited you to join it. To accept this invitation, click the button below. The link is valid for 10 days.
      `,
      htmlButton: 'Accept the invitation',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this invitation suspicious, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    invitationSecondary: {
      subject: 'Join the organization {organization} on {host}',
      text: `
An administrator from the organization {organization} invited you to join it on {host} to access {secondaryHost}. To accept this invitation, copy the URL below into the address bar of your Web browser. This URL is valid for 10 days.

{link}

If you encounter a problem with your account or if you find this invitation suspicious, feel free to contact us at {contact}.
      `,
      htmlMsg: `
      An administrator from the organization {organization} invited you to join it on {host} to access <b>{secondaryHost}</b>. To accept this invitation, click the button below. The link is valid for 10 days.
      `,
      htmlButton: 'Accept the invitation',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this invitation suspicious, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'The organization {organization} on {host} wants to add {partner} as a partner',
      text: `
An administrator from the organization {organization} invites you as a contact for the organization {partner} to join it on {host}. To accept this invitation, copy the URL below into your browser. This URL is valid for 10 days.

{link}

If you encounter a problem with your account or find this invitation suspicious, please contact us at {contact}.
      `,
      htmlMsg: `
An administrator from the organization {organization} invites you as a contact for the organization {partner} to join it on {host}. To accept this invitation, click the button below. The link is valid for 10 days.
      `,
      htmlButton: 'Accept the invitation',
      htmlAlternativeLink: 'If the button above doesn\'t work, you can copy this link into your browser\'s address bar:',
      htmlCaption: 'If you encounter a problem with your account or find this invitation suspicious, please contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Perform an action on your account on {host}',
      text: `
An action requiring confirmation by email was triggered on this address. To confirm this action, copy the URL below into your browser. This URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you find this message suspicious, feel free to contact us at {contact}.
      `,
      htmlMsg: `
An action requiring confirmation by email was triggered on this address. To confirm this action, click the button below. The link is valid for 15 minutes.
      `,
      htmlButton: 'Confirm',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this message suspicious, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Account deletion scheduled on {host}',
      text: `
The user {user} and all their related data will be deleted on {plannedDeletion}. {cause}

To cancel the deletion, you can log in with this link: {link}.

Feel free to contact us at {contact}.
      `,
      htmlMsg: 'The user {user} and all their related data will be deleted on {plannedDeletion}. {cause}',
      htmlButton: 'Log in to cancel the deletion',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link into the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this message suspicious, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'This operation was automatically triggered because this account has been inactive since {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'an invitation is sent',
    sentInvitation: 'An email was sent to {email} with an invitation to join the organization {orgName}.',
    acceptedInvitationTopic: 'an invitation is accepted',
    acceptedInvitation: 'The user {name} ({email}) has joined the organization {orgName}.',
    userCreated: 'The user {name} ({email}) has registered on the site {host}.',
    userCreatedOrg: 'The user {name} ({email}) has registered on the site {host} in the organization {orgName}.',
    sentPartnerInvitationTopic: 'a partner invitation is sent',
    sentPartnerInvitation: 'An email was sent to {email} with an invitation for the organization {partnerName} to join the organization {orgName} as a partner.',
    acceptedPartnerInvitationTopic: 'a partner invitation is accepted',
    acceptedPartnerInvitation: 'The organization {partnerName} ({email}) has joined the organization {orgName} as a partner.',
    addMemberTopic: 'a member has been added',
    addMember: 'The user {name} ({email}) has joined the organization {orgName}.'
  },
  // server-side only (not in publicMessages): reported through
  // mainSiteWarnings on the sites API and by the boot check
  mainSite: {
    ignoredField: 'The "{field}" field is ignored on the main site: this configuration comes from environment variables.',
    ignoredCategory: 'The stored value for "{category}" is ignored: MAIN_SITE_FROM_DB does not contain this category.'
  },
  // server-side only: simple-directory's own scopes, merged with the platform scopes
  scopes: {
    organizations: 'All organization scopes',
    'organizations:read': 'Read organizations, their roles and members',
    'all:read': 'Read everything the role allows, across services',
    'all:write': 'Read and edit everything the role allows, across services',
    'all:admin': 'Every right the role allows, across services'
  }
}
