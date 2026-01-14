// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Easy users and organizations management for modern Web-oriented architectures.'
  },
  common: {
    home: 'Home',
    logLink: 'login / sign up',
    logout: 'logout',
    login: 'login',
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
    members: 'Members',
    orgStorageMembers: 'Members in secondary storage',
    role: 'Role',
    search: 'Search',
    confirmOk: 'Ok',
    confirmCancel: 'Cancel',
    confirmTitle: 'Do you want to confirm this operation ?',
    firstName: 'First name',
    lastName: 'Family name',
    email: 'Email',
    modificationOk: 'Your modification was saved.',
    invitations: 'Invitations',
    accept: 'Accept',
    reject: 'Reject',
    confirmDeleteTitle: 'Delete {name}',
    confirmDeleteMsg: 'Do you really want to delete this resource ? Data will not be recoverable.',
    editTitle: 'Edit {name}',
    loggedAt: 'Logged at',
    createdAt: 'Created on',
    createdPhrase: 'Created by {name} on {date}',
    host: 'Site',
    sites: 'Sites',
    updatedAt: 'Updated on',
    maxCreatedOrgs: 'Max number of created organizations',
    maxCreatedOrgsShort: 'Max orgs',
    nbCreatedOrgs: 'Number of organizations created :',
    back: 'Back',
    next: 'Next',
    password: 'Password',
    checkInbox: 'Check your mail box',
    spamWarning: 'If you didn\'t receive an email, check if it was classified as spam in your mail box.',
    validate: 'Validate',
    delete: 'Delete',
    department: 'Department',
    departments: 'Departments',
    autoAdmin: 'Automatically add me as admin',
    asAdmin: 'Log as this user',
    delAsAdmin: 'Get back to your normal session',
    avatar: 'Avatar',
    birthday: 'Birthday',
    missingInfo: 'Missing info',
    '2FA': 'Two Factor Authentication',
    userAccount: 'Personal account',
    continue: 'Continue',
    tooLong: 'text is too long',
    settings: 'settings',
    emailConfirmed: 'creation finalized',
    emailNotConfirmed: 'creation not finalized',
    noRole: 'no role',
    downloadCsv: 'download the list in CSV format',
    authMode: 'Authentication mode',
    authProviders: 'Authentication providers',
    partners: 'Partner organizations',
    contactEmail: 'Contact email',
    orgName: 'Name of the organization',
    loginSignin: 'Login / create an account',
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
    no: 'no',
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
        contact: '<b>IMPORTANT.</b> The email address of contact for users of the service.',
        theme: {
          logo: 'The URL to replace Simple Directory\'s default logo.',
          dark: 'Switch the whole apparence of pages to a dark style.<br>Note that the default colors are mote adapted to a light style, if you switch to dark you will have to modify them.',
          cssUrl: 'Link to a stylesheet to complement the branding variables.<br>WARNING: the HTML structure can change from one version to another. Maintaining an external stylesheet is going to create extra work for you on upgrades.',
          cssText: 'Raw css content to complement the branding variables.<br>WARNING: the HTML structure can change from one version to another. Maintaining an external stylesheet is going to create extra work for you on upgrades.'
        },
        secret: {
          public: '<b>IMPORTANT.</b> The key to the public RSA signing key. See the install doc of the service.',
          private: '<b>IMPORTANT.</b> The key to the private RSA signing key. See the install doc of the service.'
        },
        analytics: 'JSON for configuring analytics, matches with the "modules" section of the lib <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>IMPORTANT.</b> The type of storage for persisting users and organizations.<br>
The default type "file" is read-only and suited for development/test or to use data exported from another system.<br>
The type "mongo" depends on accessing a MongoDB instance, it is the approriate choice for most production deployments.`,
          file: {
            users: 'Only for storage.type=file. The path to the JSON file containing users definitions',
            organizations: 'Only for storage.type=file. The path to the JSON file containing organizations definitions'
          },
          mongo: {
            url: 'Only for storage.type=mongo. The full connection string for mongo database.'
          }
        },
        mails: {
          transport: '<b>IMPORTANT.</b> A JSON object of configuration for the email transport compatible with the library <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANT.</b> The address to use as sender for emails sent by the service.'
        },
        listEntitiesMode: `Used to restrict in a global manner access to the lists of users and organizations.<br>
Can be 'anonymous', 'authenticated' or 'admin'.`,
        defaultLoginRedirect: 'Default redirection after login. If not specified user will go to his profile page.',
        onlyCreateInvited: 'If true users can not be created at first email sent. They must be invited in an organization.',
        tosUrl: '<b>IMPORTANT.</b> The URL toward you terms of services. If this parameter is empty or does not link toward a proper Web page you risk not satisfying your obligations toward your users.'
      }
    },
    use: {
      link: 'Use'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'The users can create an indeterminate number of organizations.',
        createdOrgsLimit: 'The users can create {defaultMaxCreatedOrgs} organization(s) by default.',
        explainLimit: 'Define a value to limit the number of organizations the user can create. -1 for an indeterminate value. Empty the field to fallback on the default value ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Change the email address of the user {name}',
        editUserEmailText: 'Warning! Email is an important user key, by modifying this information you run the risk of inserting an incorrect, non-functional or inconsistent address with other entries. This feature is only presented to administrators to unblock a user whose mailbox becomes inaccessible.',
        drop2FATitle: 'Disable two factor authentication',
        drop2FAText: 'Warning! This operation will disable the two factor authentication for this user.'
      },
      organizations: {
        limitOrganizationTitle: 'Edit the limits of the organization',
        members: 'member(s)',
        nbMembers: 'maximum number of members (0 for no limit)'
      },
      sites: {
        createSite: 'Define a new site',
        colorWarnings: 'Contrast warnings'
      },
      site: {
        title: 'Site configuration'
      }
    },
    login: {
      title: 'Identify yourself',
      emailLabel: 'Your email address',
      emailCaption: 'Learn more about <a href="https://medium.com/@ninjudd/passwords-are-obsolete-9ed56d483eb">passwordless</a> authentication',
      success: 'You will receive an email at the specified address. Please use the link in this email to conclude your identification.',
      maildevLink: 'Open the development mail box',
      newPassword: 'New password',
      newPassword2: 'Confirm new password',
      changePassword: 'Renew the password.',
      changePasswordTooltip: 'In case you forgot your password or if you need to change it, renew your password.',
      newPasswordMsg: 'Type twice the new password.',
      changePasswordSent: 'An email was sent to the address {email}. This email contains a link to change the password of your account.',
      passwordlessMsg1: 'To login an email is sufficient.',
      passwordlessMsg2: 'Send a login email.',
      passwordlessConfirmed: 'An email was sent to the address {email}. This email contains a link to connect to the platform.',
      createUserMsg1: 'If you didn\'t already connect to our platform you must create an account.',
      createUserMsg2: 'Create an account.',
      createUserInvit: 'Create an account to accept the invitation in organization {name}',
      createUserOrganization: 'Do you want to create and organization ?',
      createuserOrganizationHelp: 'If you create an organization you will be able to invite other users to join you and share resources.',
      tosMsg: 'Before creating an account please read <a href="{tosUrl}" target="_blank">our terms of services</a>.',
      tosConfirm: 'I confirm that I have read the terms of services for this site.',
      createUserConfirm: 'Create the account',
      createUserConfirmed: 'An email was sent to the address {email}. This email contains a link to validate the creation of your account.',
      adminMode: 'Confirm your identity to switch to admin mode.',
      oauth: 'Connect with:',
      error: 'Error',
      rememberMe: 'remember me',
      '2FACode': '6-digit code or recovery code',
      '2FAInfo': 'Enter a verification code to continue. You can get this code from the verification app on your phone. If you lose your device, you can use the recovery code downloaded when setting up two-factor authentication.',
      configure2FA: 'Configure two-factor authentication',
      configure2FAQRCode: '2-factor authentication setup qr code',
      configure2FAQRCodeMsg: 'Scan this QR code with an authentication tool of your choice (like Authy or Google Authenticator) then enter the 6-digit code offered by this application.',
      configure2FACode: '6-digit code',
      recovery2FA: 'Recovery code',
      recovery2FAInfo: 'Caution! Keep the recovery code below in a safe place. Without it, you won\'t be able to recover your account if you lose the device on which you just set up 2-factor authentication.',
      recovery2FACode: 'recovery code: ',
      recovery2FADownload: 'download a file containing the recovery code',
      recovery2FAContent: 'Recovery code for two-factor authentication {name}',
      plannedDeletion: 'Planned deletion',
      cancelDeletion: 'Cancel the deletion of the user',
      siteLogo: 'Site logo',
      partnerInvitation: 'Partner invitation',
      changeHost: 'Account associated with back-office',
      authorizeApp: 'Authorize application',
      authorizeAppMsg: 'The application {appName} wants to access your account. Do you want to authorize it?',
      authorizeAppConfirm: 'Authorize'
    },
    organization: {
      addMember: 'Invite a user to join this organization',
      disableInvite: 'This organization already contains its maximum number of members.',
      deleteMember: 'Delete this user from the list of members',
      editMember: 'Change the role of this user in the organization',
      memberReadOnly: 'This user\'s membership to the organization comes from an identity provider and cannot be modified here.',
      confirmEditMemberTitle: 'Change {name}',
      confirmDeleteMemberTitle: 'Exclude {name}',
      confirmDeleteMemberMsg: 'Do you really want to delete this user from the list of members of the organization {org} ?',
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
      confirmDeleteDepartmentMsg: 'Are you sure you want to delete {name} from your organization ?',
      deleteDepartmentHasMembers: 'This department is affected to {count} member(s) of the organization. You can\'t delete it in this state.',
      departmentIdInvalid: 'Identifier should contain anly letters, numbers and spaces',
      inviteLink: 'In case of problem in the communication by email you can send the confirmation link below by another means. Warning ! You risk inserting an incorrect or non-functional email address in the user database. This email address may cause multiple problems later: change of password, sending alerts, etc.',
      '2FARoles': 'Two-factor authentication.',
      '2FARolesMsg': 'Make two-factor authentication mandatory for users with these roles:',
      sendInvitationLink: 'Send another invitation link',
      addPartner: 'Invite a partner organization',
      deletePartner: 'Delete this partner',
      depSortCreation: 'Last created',
      depSortAlpha: 'Alphabetical order',
      deletePartnerWarning: 'Warning: permissions granted to the partner organization will not be modified by this operation. You should probably modify them yourself.',
      fromCache: 'Last synchronization of this list with the identity provider: {fromNow}.',
      roleLabel: 'Label for the role "{role}"'
    },
    invitation: {
      title: 'Invitation validated',
      msgSameUser: 'Your invitation to become member of an organization has been validated. You can visit <a href="{profileUrl}">your profile</a>.',
      msgDifferentUser: 'This invitation to become member of an organization has been validated. You can <a href="{loginUrl}">login with</a> the invited account.'
    },
    avatar: {
      load: 'load a new avatar',
      prepare: 'Prepare the image'
    },
    me: {
      noOrganization: 'Your are not a member in any organization.',
      operations: 'Sensitive operations',
      deleteMyself: 'Delete this account',
      deleteMyselfAlert: 'If your delete your account you will have a {plannedDeletionDelay} days delay after which all associated data will be deleted and will not be recoverable.',
      deleteMyselfCheck: 'check and click on OK to confirm the deletion of the user {name} and all its data.',
      accountChanges: 'Managing account switching',
      defaultOrg: 'Activate this account by default after each login',
      ignorePersonalAccount: 'Check this box if you do not wish to use this platform outside of an organization account',
      sessions: 'Your sessions',
      deleteSession: 'Delete the session on {deviceName}?',
      deleteSessionWarning: 'Deleting a session may take up to {duration} to be fully applied.',
      settings: 'Your settings'
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
      createOrg: 'create a new organization',
      newOrgName: 'name of the new organization',
      create: 'create',
      acceptAs: 'accept on behalf of {name}'
    },
    changeHost: {
      msg1: 'The account {email} does not exist on {host} but exists on {mainHost}.',
      sso1: 'Solution: use {mainHost} to log in',
      sso2: 'The login page offers a button to log in from {mainHost} that you can use. You can also use <a class="text-primary" href="{mainHostLogin}">this link.</a>.',
      solution1: 'Solution: move the account to {host}',
      solution2: 'If you choose this solution, you will lose the ability to log in to {mainHost}.',
      confirmMigration: 'move the account to {host} and lose access to {mainHost}'
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
    maxCreatedOrgs: 'The user cannot create more organizations. Limit attained.',
    permissionDenied: 'Insufficient permissions.',
    nonEmptyOrganization: 'You must remove other members from this organization',
    userUnknown: 'Unknown user.',
    orgaUnknown: 'Unknown organization.',
    invitationConflict: 'This user is already member of the organization.',
    unknownRole: 'Role {role} is unknown.',
    serviceUnavailable: 'Service unavailable because of maintenance.',
    badCredentials: 'Email address or password invalid.',
    updatePassword: 'It is necessary to update your password, because it was not updated for a long time.',
    missingToken: 'The id_token parameter is missing.',
    invalidToken: 'The token is not valid. Maybe it is expired.',
    differentPasswords: 'The passwords are different',
    noPasswordless: 'Passordless authentication is not accepted by this service.',
    rateLimitAuth: 'Too many attemps in a short interval. Please wait before trying again.',
    invalidInvitationToken: 'The invitation link you received is invalid.',
    expiredInvitationToken: 'The invitation link you received has expired, you can no longer accept this invitation.',
    maxNbMembers: 'The organization already contains the maximum number of members allowed by its quotas.',
    unknownOAuthProvider: 'OAuth identification not supported.',
    unknownSAMLProvider: 'SAML identification not supported.',
    adminModeOnly: 'Functionality reserved for super administrators.',
    '2FANotConfigured': 'Two-factor authentication is required for this account and is not yet configured.',
    passwordless2FA: 'Passwordless authentication is incompatible with two-factor authentication required for this account.',
    bad2FAToken: 'Invalid or expired verification code for two-factor authentication',
    plannedDeletion: 'The deletion of the user {name} and all its data is planned on the {plannedDeletion}.',
    onlyCreateInvited: 'You can not create an account directly. You must be invited by an organization.',
    badIDPQuery: 'Request considered invalid by the identity provider.',
    duplicateDep: 'The new department is a duplicate',
    passwordEntropy: 'The password is not strong enough.',
    passwordMinLength: 'The password must contain at least {minLength} chars.',
    passwordMinCharClasses: 'The password must contain at least {minCharClasses} different types of characters (lowercase, uppercase, digit, special char).',
    forbiddenPassword: 'This password was found in a list of known passwords and cannot be used.',
    samePassword: 'The new password must be different from the old one.',
  },
  mails: {
    creation: {
      subject: 'Welcome to {host}',
      text: `
An account creation request was made from {host}. To activate the account you must copy the URL below in the address bar of your Web browser. This URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you didn't submit this identification request to {host}, feel free to contact us at {contact}.
      `,
      htmlMsg: 'An account creation request was made from <a href="{origin}">{host}</a>. To activate the account you must click on the button below. This link is valid for 15 minutes.',
      htmlButton: 'Validate the account creation',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link in the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you didn\'t submit this identification request to <a href="{origin}">{host}</a>, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identification on {host}',
      text: `
An identification request was made from {host}. To confirm copy the URL below in the address bar of your Web browser. This URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you didn't submit this identification request to {host}, feel free to contact us at {contact}.
      `,
      htmlMsg: 'An identification request was made from <a href="{origin}">{host}</a>. To confirm click on the button below. This link is valid for 15 minutes.',
      htmlButton: 'Connect to {host}',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link in the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you didn\'t submit this identification request to <a href="{origin}">{host}</a>, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Failure to authenticate to {host}',
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
An account creation request was made from {host}, but it was rejected as this email address is already associated to an account.

Feel free to contact us at {contact}.
      `,
      htmlMsg: 'An account creation request was made from <a href="{origin}">{host}</a>, but it was rejected as this email address is already associated to an account.',
      htmlCaption: 'Feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Join the organization {organization} on {host}',
      text: `
An administrator from the organization {organization} invited you to join. To accept this invitation copy the URL below in the address bar of your Web browser.

{link}

If you encounter a problem with your account or if you find this invitation suspicious feel free to contact us at {contact}.
      `,
      htmlMsg: `
      An administrator from the organization {organization} invited you to join. To accept this invitation click on the button below.
      `,
      htmlButton: 'Accept the invitation',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link in the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this invitation suspicious feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'The organization {organization} on {host} wants to add {partner} as a partner',
      text: `
An administrator from the organization {organization} invites you as a contact for the organization {partner} to join on {host}. To accept this invitation, copy the URL below into your browser. This URL is valid for 10 days.

{link}

If you encounter a problem with your account or find this invitation suspicious, please contact us at {contact}.
      `,
      htmlMsg: `
An administrator from the organization {organization} invites you as a contact for the organization {partner} to join on {host}. To accept this invitation, click the button below. The link is valid for 10 days.
      `,
      htmlButton: 'Accept the invitation',
      htmlAlternativeLink: 'If the button above doesn\'t work, you can copy this link into your browser\'s address bar:',
      htmlCaption: 'If you encounter a problem with your account or find this invitation suspicious, please contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Accomplish an action on your account {host}',
      text: `
An action requiring confirmation by email was triggered on this address. To confirm this action you can copy the URL below in your browers. Ths URL is valid for 15 minutes.

{link}

If you encounter a problem with your account or if you find this message suspicious feel free to contact us at {contact}.
      `,
      htmlMsg: `
An action requiring confirmation by email was triggered on this address. To confirm this action click on the button below. The link is valid for 15 minutes.
      `,
      htmlButton: 'Confirm',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link in the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this message suspicious feel free to contact us at <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Account deletion programmed on {host}',
      text: `
The user {user} and all the data related to him will be deleted on the {plannedDeletion}. {cause}

To cancel the deletion you can login here {link}.

Feel free to contact us at {contact}.
      `,
      htmlMsg: 'The user {user} and all the data related to him will be deleted on the {plannedDeletion}. {cause}',
      htmlButton: 'Login to cancel the deletion',
      htmlAlternativeLink: 'If the button doesn\'t work, you can copy/paste this link in the address bar of your browser:',
      htmlCaption: 'If you encounter a problem with your account or if you find this message suspicious feel free to contact us at <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'This operation was automatically triggered because this account is inactive since {date}.'
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
  }
}
