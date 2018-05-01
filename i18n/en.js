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
  },
  mails: {
    login: {
      subject: 'Welcome to {{host}}',
      text: `
An identification request was made from {{host}}. To confirm, copy the URL below in the address bar of your Web browser. This URL is valid for 15 minutes.

{{link}}

If you encounter a problem with your account or if you didn't submit this identification request to {{host}}, feel free to contact us at {{contact}}.
      `,
      mjml: `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100" src="{{logo}}"></mj-image>
        <mj-text font-size="14px" font-weight="500" line-height="21px" color="#212121" font-family="helvetica" align="center" padding-top="16px" padding-bottom="24px">
          An identification request was made from <a href="//{{host}}">{{host}}</a>. To confirm, click on the button below. This link is valid for 15 minutes.</mj-text>
        <mj-button background-color="{{brand.theme.primary}}" color="#fff" href="{{link}}" border-radius="4px">
          Connect to {{host}}
        </mj-button>
        <mj-divider border-width="1px" border-color="#424242" padding-top="48px"></mj-divider>
        <mj-text font-size="12px" font-weight="400" line-height="18px" color="#424242" font-family="helvetica">
          If you encounter a problem with your account or if you didn't submit this identification request to <a href="//{{host}}">{{host}}</a>, feel free to contact us at <a href="mailto:{{contact}}">{{contact}}</a>.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
      `
    }
  }
}
