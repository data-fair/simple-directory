// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  root: {
    title: 'Simple Directory',
    description: 'Easy users and organizations management for modern Web-oriented architectures.'
  },
  common: {
    home: 'Home',
    logLink: 'login / sign up',
    logout: 'logout',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'My account',
    organization: 'Organization',
    createOrganization: 'Create organization',
    dashboard: 'Dashboard',
    description: 'Description',
    name: 'Name',
    save: 'Save',
    members: 'Members',
    role: 'Role',
    search: 'Search',
    confirmOk: 'Ok',
    confirmCancel: 'Cancel'
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
      varName: `Environment variable`,
      varDesc: 'Description',
      varDefault: 'Default value',
      varDescriptions: {
        publicUrl: `<b>IMPORTANT.</b> The URL where the service will be exposed. For example https://koumoul.com/simple-directory`,
        admins: `<b>IMPORTANT.</b> The list of email addresses of the administrators of this service.`,
        brand: {
          logo: `The URL to replace Simple Directory's default logo.`
        },
        storage: {
          type: `<b>IMPORTANT.</b> The type of storage for persisting users and organizations.<br>
The default type "file" is read-only and suited for development/test or to use data exported from another system.<br>
The type "mongo" depends on accessing a MongoDB instance, it is the approriate choice for most production deployments.`,
          file: {
            users: `Only for storage.type=file. The path to the JSON file containing users definitions`,
            organizations: `Only for storage.type=file. The path to the JSON file containing organizations definitions`
          },
          mongo: {
            url: 'Only for storage.type=mongo. The full connection string for mongo database.'
          }
        }
      }
    },
    use: {
      link: 'Use'
    }
  },
  pages: {
    login: {
      title: 'Identify yourself',
      emailTitle: `By receiving an email`,
      emailLabel: 'Your email address',
      emailCaption: `Learn more about <a href="https://medium.com/@ninjudd/passwords-are-obsolete-9ed56d483eb">passwordless</a> authentication`,
      success: `You will receive an email at the specified address. Please use the link in this email to conclude your identification.`
    },
    organization: {
      addMember: 'Invite a user to join this organization',
      deleteMember: 'Delete this user from the list of members',
      confirmDeleteMemberTitle: 'Exclude {name}',
      confirmDeleteMemberMsg: 'Do you really want to delete this user from the list of members of this organization ?',
      deleteMemberSuccess: 'The user {name} was excluded from the organization',
      inviteEmail: `Email address of the user`,
      inviteSuccess: `An invitation was sent to the email address {email}`
    }
  },
  errors: {
    badEmail: 'Email address is empty or malformed.'
  },
  mails: {
    login: {
      subject: 'Welcome to {{host}}',
      text: `
An identification request was made from {{host}}. To confirm, copy the URL below in the address bar of your Web browser. This URL is valid for 15 minutes.

{{link}}

If you encounter a problem with your account or if you didn't submit this identification request to {{host}}, feel free to contact us at {{contact}}.
      `,
      htmlMsg: `An identification request was made from <a href="//{host}">{host}</a>. To confirm, click on the button below. This link is valid for 15 minutes.`,
      htmlButton: `Connect to {host}`,
      htmlCaption: `If you encounter a problem with your account or if you didn't submit this identification request to <a href="//{host}">{host}</a>, feel free to contact us at <a href="mailto:{contact}">{contact}</a>.`
    },
    invitation: {
      subject: `Join the organization {organization} on {host}`,
      text: `
An administrator from the organization {organization} invited you to join. To accept or reject this invitation you must visit your account on {host}.
If you do not have an account yet you can identify yourself first using this email address, the invitation will be waiting for you on your profile.

{{link}}

If you encounter a problem with your account or if you find this invitation suspicious feel free to contact us at {contact}.
      `,
      htmlMsg: `
      An administrator from the organization {organization} invited you to join. To accept or reject this invitation you must visit your account on {host}.
      If you do not have an account yet you can identify yourself first using this email address, the invitation will be waiting for you on your profile.
      `,
      htmlButton: 'See your profile',
      htmlCaption: `If you encounter a problem with your account or if you find this invitation suspicious feel free to contact us at <a href="mailto:{contact}">{contact}</a>.`
    }
  }
}
