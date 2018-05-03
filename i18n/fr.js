// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  root: {
    title: 'Simple Directory',
    description: 'Gestion simplifiée de vos utilisateurs et vos organisations dans une architecture moderne orientée Web.'
  },
  common: {
    home: 'Accueil',
    logLink: `Se connecter / s'inscrire`,
    logout: 'Se déconnecter',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'Mon compte',
    organization: 'Organisation',
    createOrganization: 'Créer une organisation',
    dashboard: 'Tableau de bord',
    description: 'Description',
    name: 'Nom',
    save: 'Enregistrer'
  },
  doc: {
    about: {
      link: 'À propos'
    },
    install: {
      link: 'Installation'
    },
    config: {
      link: 'Configuration',
      i18nKey: 'Clé dans le fichier I18N',
      i18nVar: `Variable d'environnement`,
      i18nVal: 'Valeur',
      varKey: 'Clé dans le fichier de configuration',
      varName: `Variable d'environnement`,
      varDesc: 'Description',
      varDefault: 'Valeur par défaut',
      varDescriptions: {
        publicUrl: `<b>IMPORTANT.</b> L'URL à laquelle le service sera exposé. Par exemple https://koumoul.com/simple-directory`,
        admins: `<b>IMPORTANT.</b> La liste des adresses mails des administrateurs du service.`,
        brand: {
          logo: `L'URL du logo à utiliser pour remplacer le logo par défaut de <i>Simple Directory</i>.`
        },
        storage: {
          type: `<b>IMPORTANT.</b> Le type de stockage pour la persistence des utilisateurs et des organisations.<br>
Le type "file" par défaut est lecture seule et est adapté en développement/test ou pour utiliser une collection d'utilisateurs exportée depuis un autre système.<br>
Le type "mongo" dépend d'un accès à une base de données MongoDB, c'est le mode approprié pour la plupart des installations en production.`,
          file: {
            users: `Uniquement pour storage.type=file. Le chemin du fichier JSON contenant les définitions d'utilisateurs`,
            organizations: `Uniquement pour storage.type=file. Le chemin du fichier JSON contenant les définitions d'organisations`
          },
          mongo: {
            url: 'Uniquement pour storage.type=mongo. La chaine de connexion complète à la base de données mongodb.'
          }
        }
      }
    },
    use: {
      link: 'Utilisation'
    }
  },
  pages: {
    login: {
      title: 'Identifiez vous',
      emailTitle: `En recevant un email`,
      emailLabel: 'Votre adresse mail',
      emailCaption: `En savoir plus sur l'authentification <a href="https://koumoul.com/blog/passwordless">sans mot de passe</a>`,
      success: `Vous allez recevoir un email à l'adresse renseignée qui contiendra un lien. Veuillez ouvrir ce lien pour terminer votre identification.`
    }
  },
  errors: {
    badEmail: 'Adresse mail non renseignée ou malformée'
  },
  mails: {
    login: {
      subject: 'Bienvenue sur {{host}}',
      text: `
Une demande d'identification a été faite depuis {{host}}. Pour la confirmer, copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{{link}}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à {{host}}, n'hésitez pas à nous contacter à {{contact}}.
      `,
      mjml: `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100" src="{{logo}}"></mj-image>
        <mj-text font-size="14px" font-weight="500" line-height="21px" color="#212121" font-family="helvetica" align="center" padding-top="16px" padding-bottom="24px">
          Une demande d'identification a été faite depuis <a href="//{{host}}">{{host}}</a>. Pour la confirmer, cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.
        </mj-text>
        <mj-button background-color="{{brand.theme.primary}}" color="#fff" href="{{link}}" border-radius="4px">
          Connexion à {{host}}
        </mj-button>
        <mj-divider border-width="1px" border-color="#424242" padding-top="48px"></mj-divider>
        <mj-text font-size="12px" font-weight="400" line-height="18px" color="#424242" font-family="helvetica">
          Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à <a href="//{{host}}">{{host}}</a>, n'hésitez pas à nous contacter à <a href="mailto:{{contact}}">{{contact}}</a>.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
      `
    }
  }
}
