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
    save: 'Enregistrer',
    members: 'Membres',
    role: 'Rôle',
    search: 'Rechercher',
    confirmOk: 'Ok',
    confirmCancel: 'Annuler',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    email: 'Adresse mail',
    modificationOk: 'Votre modification a été appliquée.',
    invitations: 'Invitations',
    accept: 'Accepter',
    reject: 'Rejeter'
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
    },
    organization: {
      addMember: 'Inviter un utilisateur à rejoindre l\'organisation',
      deleteMember: `Supprimer cet utilisateur de la liste des membres de l'organisation`,
      confirmDeleteMemberTitle: 'Exclure {name}',
      confirmDeleteMemberMsg: `Voulez vous vraiment supprimer cet utilisateur de la liste des membres de l'organisation ?`,
      deleteMemberSuccess: `L'utilisateur {name} a été exclu de l'organisation`,
      inviteEmail: `Adresse mail de l'utilisateur`,
      inviteSuccess: `Une invitation a été envoyée à l'adresse {email}`
    },
    myAccount: {
      joinOrga: `Rejoindre {name} en tant que {role}`,
      confirmRejectInvitation: `Voulez vous vraiment rejeter l'invitation à rejoindre {name} ?`,
      invitationAccepted: `Vous êtes maintenant membre de l'organisation {name}.`
    }
  },
  errors: {
    badEmail: 'Adresse mail non renseignée ou malformée'
  },
  mails: {
    login: {
      subject: 'Bienvenue sur {host}',
      text: `
Une demande d'identification a été faite depuis {host}. Pour la confirmer, copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à {host}, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `Une demande d'identification a été faite depuis <a href="//{host}">{host}</a>. Pour la confirmer cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.`,
      htmlButton: `Connexion à {host}`,
      htmlCaption: `Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à <a href="//{host}">{host}</a>, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    invitation: {
      subject: `Rejoignez l'organisation {organization} sur {host}`,
      text: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 10 jours.
Si vous n'avez pas encore de compte celui-ci sera créé automatiquement.

{{link}}

Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation cliquez sur le bouton ci-dessous. Le lien est valide 10 jours.
Si vous n'avez pas encore de compte celui-ci sera créé automatiquement.
      `,
      htmlButton: `Accepter l'invitation`,
      htmlCaption: `Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    }
  }
}