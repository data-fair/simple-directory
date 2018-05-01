// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  title: 'Simple Directory',
  description: 'Easy users and organizations management for modern Web-oriented architectures.',
  home: 'Home',
  logLink: 'login / sign up',
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
        brand: {
          logo: `The URL to replace Simple Directory's default logo.`
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
    }
  },
  errors: {
    badEmail: 'Email address is empty or malformed.'
  }
}
