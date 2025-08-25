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
    activateAdminMode: 'Activate admin mode',
    deactivateAdminMode: 'Deactivate admin mode',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'Personal info',
    myOrganizations: 'My organizations',
    organization: 'Organization',
    organizations: 'Organizations',
    user: 'User',
    users: 'Users',
    createOrganization: 'Create organization',
    dashboard: 'Dashboard',
    description: 'Description',
    id: 'Identifier',
    name: 'Name',
    save: 'Save',
    members: 'Members',
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
    host: 'Site',
    sites: 'Sites',
    createdPhrase: 'Created by {name} on {date}',
    updatedAt: 'Updated on',
    maxCreatedOrgs: 'Max number of created organizations',
    nbCreatedOrgs: 'Number of organizations created :',
    back: 'Back',
    next: 'Next',
    password: 'Password',
    checkInbox: 'Check your mail box',
    spamWarning: 'If you didn\'t receive an email, check if it was classified as spam in your mail box.',
    validate: 'Validate',
    department: 'Department',
    departments: 'Departments',
    autoAdmin: 'Automatically add me as admin',
    asAdmin: 'Log as this user',
    delAsAdmin: 'Get back to your normal session',
    avatar: 'Avatar',
    birthday: 'Birthday',
    missingInfo: 'Missing info',
    continue: 'Continue',
    tooLong: 'text is too long',
    settings: 'settings',
    emailNotConfirmed: 'creation not finalized',
    noRole: 'no role',
    downloadCsv: 'download the list in CSV format',
    authMode: 'Authentication mode',
    adminGlobal: 'Global administration',
    adminSite: 'Site administration',
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
        editUserEmailText: 'Warning! Email is an important user key, by modifying this information you run the risk of inserting an incorrect, non-functional or inconsistent address with other entries. This feature is only presented to administrators to unblock a user whose mailbox becomes inaccessible.'
      },
      organizations: {
        limitOrganizationTitle: 'Edit the limits of the organization',
        members: 'member(s)',
        nbMembers: 'maximum number of members (0 for no limit)'
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
      tosMsg: 'Before creating an account please read <a href="{tosUrl}" target="_blank">our terms of services</a>.',
      tosConfirm: 'I confirm that I have read the terms of services for this site.',
      createUserConfirm: 'Create the account',
      createUserConfirmed: 'An email was sent to the address {email}. This email contains a link to validate the creation of your account.',
      adminMode: 'Confirm your identity to switch to admin mode.',
      oauth: 'Connect with:',
      error: 'Error',
      plannedDeletion: 'Planned deletion',
      cancelDeletion: 'Cancel the deletion of the user',
      siteLogo: 'Site logo'
    },
    organization: {
      addMember: 'Invite a user to join this organization',
      disableInvite: 'This organization already contains its maximum number of members.',
      deleteMember: 'Delete this user from the list of members',
      editMember: 'Change the role of this user in the organization',
      confirmEditMemberTitle: 'Change {name}',
      confirmDeleteMemberTitle: 'Exclude {name}',
      confirmDeleteMemberMsg: 'Do you really want to delete this user from the list of members of the organization {org} ?',
      deleteMemberSuccess: 'The user {name} was excluded from the organization',
      inviteEmail: 'Email address of the user',
      inviteSuccess: 'An invitation was sent to the address {email}',
      memberConflict: 'This user is already a member',
      back: 'Back',
      next: 'Next',
      addDepartment: 'Create {departmentLabel}',
      editDepartment: 'Edit {departmentLabel}',
      deleteDepartment: 'Delete {departmentLabel}',
      confirmEditDepartmentTitle: 'Edit {name}',
      confirmDeleteDepartmentTitle: 'Delete {name}',
      confirmDeleteDepartmentMsg: 'Are you you want to delete {name} from your organization ?',
      deleteDepartmentHasMembers: 'This department is affected to {count} member(s) of the organization. You can\'t delete it in this state.',
      departmentIdInvalid: 'Identifier should contain anly letters, numbers and spaces',
      inviteLink: 'In case of problem in the communication by email you can send the confirmation link below by another means. Warning ! You risk inserting an incorrect or non-functional email address in the user database. This email address may cause multiple problems later: change of password, sending alerts, etc.',
      sendInvitationLink: 'Send another invitation link'
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
      ignorePersonalAccount: 'Check this box if you do not wish to use this platform outside of an organization account'
    }
  },
  errors: {
    badEmail: 'Email address is empty or malformed.',
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
    plannedDeletion: 'The deletion of the user {name} and all its data is planned on the {plannedDeletion}.',
    onlyCreateInvited: 'You can not create an account directly. You must be invited by an organization.',
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
    userCreatedOrg: 'The user {name} ({email}) has registered on the site {host} in the organization {orgName}.'
  }
}
