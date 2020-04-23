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
    login: 'Se connecter',
    activateAdminMode: 'Activer mode admin',
    deactivateAdminMode: 'Désactiver mode admin',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'Mon compte',
    organization: 'Organisation',
    organizations: 'Organisations',
    user: 'Utilisateur',
    users: 'Utilisateurs',
    createOrganization: 'Créer une organisation',
    dashboard: 'Tableau de bord',
    description: 'Description',
    id: 'Identifiant',
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
    reject: 'Rejeter',
    confirmDeleteTitle: 'Supprimer {name}',
    confirmDeleteMsg: 'Êtes vous sur de vouloir supprimer cette ressource ? Attention les données ne pourront pas être récupérées.',
    editTitle: 'Modifer {name}',
    loggedAt: 'Dernier login',
    createdAt: 'Créé le',
    createdPhrase: 'Créé par {name} le {date}',
    updatedAt: 'Mis à jour le',
    maxCreatedOrgs: `Nombre maximal d'organisations à créer`,
    nbCreatedOrgs: `Nombre d'organisations créées :`,
    back: 'Retour',
    next: 'Suivant',
    password: 'Mot de passe',
    checkInbox: 'Vérifiez votre boite mail',
    spamWarning: `Si vous n'avez pas reçu de mail, vérifiez qu'il n'a pas été classé automatiquement en tant que spam.`,
    validate: 'Valider',
    department: 'Département',
    departments: 'Départements',
    autoAdmin: `M'ajouter automatiquement comme administrateur`,
    asAdmin: 'Se connecter en tant que cet utiisateur',
    delAsAdmin: 'Revenir à ma session administrateur',
    avatar: 'Avatar',
    birthday: 'Anniversaire'
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
        contact: `<b>IMPORTANT.</b> L'adresse mail de contact pour les utilisateurs du service.`,
        theme: {
          logo: `L'URL du logo à utiliser pour remplacer le logo par défaut de <i>Simple Directory</i>.`,
          dark: `Rendre l'apparence complète des pages sombre.<br>Notez que les couleurs par défaut sont plus adaptées à un thème clair. Si vous passez en sombre vous allsez devoir également modifier ces couleurs.`,
          cssUrl: 'Lien vers une feuille de style pour compléter les variables de personnalisation.<br>ATTENTION: la structure HTML peut varier de manière importante entre 2 versions. Maintenir cette feuille de style va vous créer du travail supplémentaire à chaque montée en version.',
          cssText: 'Contenu CSS textuel.<br>ATTENTION: la structure HTML peut varier de manière importante entre 2 versions. Maintenir cette feuille de style va vous créer du travail supplémentaire à chaque montée en version.'
        },
        secret: {
          public: `<b>IMPORTANT.</b> Le chemin vers la clé publique de chiffrement RSA. Voir la documentation d'installation du service.`,
          private: `<b>IMPORTANT.</b> Le chemin vers la clé privée de chiffrement RSA. Voir la documentation d'installation du service.`
        },
        analytics: 'JSON de configuration des analytics, correspond à la partie "modules" de configuration de la librairie <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
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
        },
        mails: {
          transport: '<b>IMPORTANT.</b> Un objet JSON de configration du transport mail compatible avec la librairie <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: `'<b>IMPORTANT.</> L'adresse à renseigner comme expéditeur des mails émis par le service.`
        },
        listEntitiesMode: `Permet de restreindre de manière globale l'accès aux listes d'utilisateurs et d'organisations.<br>
Peut valoir 'anonymous', 'authenticated' ou 'admin'.`,
        defaultLoginRedirect: `Redirection par défaut après login. Si non spécifié l'utilisateur sera redirigé vers son profil.`,
        onlyCreateInvited: `Si vrai les utilisateurs ne seront pas créés au premier email envoyé. Ils doivent être invités dans une organisation.`,
        tosUrl: `<b>IMPORTANT.</b> Une URL vers vos conditions générales d'utilisation. Si ce paramètre n'est pas défini et ne pointe pas vers une page Web correcte vous risquez de ne pas respecter vos obligations vis à vis de vos utilisateurs.`
      }
    },
    use: {
      link: 'Utilisation'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: `Les utilisateurs peuvent créer un nombre indéfini d'organisations.`,
        createdOrgsLimit: `Les utilisateurs peuvent créer {defaultMaxCreatedOrgs} organisation(s) par défaut.`,
        explainLimit: `Définissez une valeur pour limiter le nombre d'organisations que cet utilisateur peut créer. -1 pour un nombre indéterminé. Videz le champs pour retomber sur la valeur par défaut ({defaultMaxCreatedOrgs}).`
      }
    },
    login: {
      title: 'Identifiez vous',
      emailLabel: 'Votre adresse mail',
      emailCaption: `En savoir plus sur l'authentification <a href="https://koumoul.com/blog/passwordless">sans mot de passe</a>`,
      success: `Vous allez recevoir un email à l'adresse renseignée qui contiendra un lien. Veuillez ouvrir ce lien pour terminer votre identification.`,
      maildevLink: 'Accédez à la boite mail de développement',
      newPassword: 'Nouveau mot de passe',
      newPassword2: 'Confirmez le nouveau mot de passe',
      changePassword: 'Renouveler le mot de passe',
      changePasswordTooltip: `En cas d'oubli de votre mot de passe ou de besoin de modification de celui-ci, renouvelez votre mot de passe.`,
      newPasswordMsg: `Saisissez 2 fois le nouveau mot de passe.`,
      changePasswordSent: `Un email vous a été envoyé à l'adresse {email}. Cet email contient un lien pour modifier le mot de passe associé à votre compte.`,
      passwordlessMsg1: `Pour vous connecter un email suffit.`,
      passwordlessMsg2: `Envoyer un email de connexion.`,
      passwordlessConfirmed: `Un email vous a été envoyé à l'adresse {email}. Cet email contient un lien pour vous connecter sur notre plateforme.`,
      createUserMsg1: `Si vous ne vous êtes pas encore connecté à notre plateforme veuillez créer un compte.`,
      createUserMsg2: `Créer un compte`,
      tosMsg: `Avant de créer votre compte veuillez prendre connaissance de <a href="{tosUrl}" target="_blank">nos conditions générales d'utilisation</a>.`,
      tosConfirm: `Je confirme avoir lu les conditions générales d'utilisation pour ce site.`,
      createUserConfirm: 'Créer le compte',
      createUserConfirmed: `Un email vous a été envoyé à l'adresse {email}. Cet email contient un lien pour valider la création du compte.`,
      adminMode: 'Confirmez votre identité pour passer en mode administration.',
      oauth: 'Connectez vous avec :'
    },
    organization: {
      addMember: 'Inviter un utilisateur à rejoindre l\'organisation',
      deleteMember: `Supprimer cet utilisateur de la liste des membres de l'organisation`,
      editMember: `Modifier le rôle de cet utilisateur dans l'organisation`,
      confirmEditMemberTitle: 'Modifier {name}',
      confirmDeleteMemberTitle: 'Exclure {name}',
      confirmDeleteMemberMsg: `Voulez vous vraiment supprimer cet utilisateur de la liste des membres de l'organisation ?`,
      deleteMemberSuccess: `L'utilisateur {name} a été exclu de l'organisation`,
      inviteEmail: `Adresse mail de l'utilisateur`,
      inviteSuccess: `Une invitation a été envoyée à l'adresse {email}`,
      memberConflict: 'Cet utilisateur est déjà membre',
      departmentLabelTitle: `Libellé du concept "département"`,
      departmentLabelHelp: `Laissez vide pour afficher "département". Renseignez pour utiliser un autre vocabulaire comme "service", "agence", etc.`,
      addDepartment: 'Créer {departmentLabel}',
      editDepartment: 'Modifier {departmentLabel}',
      deleteDepartment: 'Supprimer {departmentLabel}',
      confirmEditDepartmentTitle: 'Modifier {name}',
      confirmDeleteDepartmentTitle: 'Supprimer {name}',
      confirmDeleteDepartmentMsg: `Voulez vous vraiment supprimer {name} de votre organisation ?`,
      departmentIdInvalid: 'L\'identifiant ne doit contenir que des lettres, nombres et espaces.'
    },
    invitation: {
      title: 'Invitation validée',
      msgSameUser: `Votre invitation à être membre d'une organisation a bien été acceptée. Vous pouvez consulter <a href="{profileUrl}">votre profil</a>.`,
      msgDifferentUser: `Cette invitation à être membre d'une organisation a bien été acceptée. Vous pouvez <a href="{loginUrl}">vous connecter</a> avec le compte invité.`
    },
    avatar: {
      prepare: `Préparez l'image`
    }
  },
  errors: {
    badEmail: 'Adresse mail non renseignée ou malformée.',
    maxCreatedOrgs: `L'utilisateur ne peut pas créer plus d'organisations. Quota atteint.`,
    permissionDenied: 'Permissions insuffisantes.',
    nonEmptyOrganization: `Il faut supprimer les autres membres de l'organisation`,
    userUnknown: 'Utilisateur inconnu.',
    orgaUnknown: 'Organisation inconnue.',
    invitationConflict: 'Cet utilisateur est déjà membre de cette organisation.',
    unknownRole: 'Rôle {role} inconnu.',
    serviceUnavailable: 'Service indisponible pour cause de maintenance.',
    badCredentials: `Adresse email ou mot de passe invalide.`,
    invalidToken: `Le jeton n'est pas valide. Il est peut-être périmé.`,
    malformedPassword: 'Le mot de passe doit faire au moins 8 caractères et contenir au moins un chiffre et une majuscule.',
    noPasswordless: `L'authentification sans mot de passe n'est pas acceptée par ce service.`,
    rateLimitAuth: `Trop de tentatives dans un bref interval. Veuillez patienter avant d'essayer de nouveau.`
  },
  mails: {
    creation: {
      subject: 'Bienvenue sur {host}',
      text: `
Une demande de création de compte a été faite depuis {host} pour cette adresse email. Pour activer le compte vous devez copier l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à créer un compte sur {host}, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `Une demande de création de compte a été faite depuis <a href="{origin}">{host}</a> pour cette adresse email. Pour la confirmer cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.`,
      htmlButton: `Valider la création de compte`,
      htmlCaption: `Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à <a href="{origin}">{host}</a>, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    login: {
      subject: 'Identification sur {host}',
      text: `
Une demande d'identification a été faite depuis {host}. Pour la confirmer, copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à {host}, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `Une demande d'identification a été faite depuis <a href="{origin}">{host}</a>. Pour la confirmer cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.`,
      htmlButton: `Connexion à {host}`,
      htmlCaption: `Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à <a href="{origin}">{host}</a>, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    noCreation: {
      subject: `Échec d'authentification sur {host}`,
      text: `
Une demande d'identification a été faite depuis {host}, mais elle a été rejetée car cette adresse email est inconnue ou n'a pas été validée.

N'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `Une demande d'identification a été faite depuis <a href="{origin}">{host}</a>, mais elle a été rejetée car cette adresse email est inconnue ou n'a pas été validée.`,
      htmlCaption: `N'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    conflict: {
      subject: `Échec de création de compte sur {host}`,
      text: `
Une demande de création de compte a été faite depuis {host}, mais elle a été rejetée car cette adresse email est déjà associée à un compte.

N'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `Une demande de création de compte a été faite depuis <a href="{origin}">{host}</a>, mais elle a été rejetée car cette adresse email est déjà associée à un compte.`,
      htmlCaption: `N'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    invitation: {
      subject: `Rejoignez l'organisation {organization} sur {host}`,
      text: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 10 jours.
Si vous n'avez pas encore de compte celui-ci sera créé automatiquement.

{link}

Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation cliquez sur le bouton ci-dessous. Le lien est valide 10 jours.
Si vous n'avez pas encore de compte celui-ci sera créé automatiquement.
      `,
      htmlButton: `Accepter l'invitation`,
      htmlCaption: `Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    },
    action: {
      subject: `Effectuez une action sur votre compte sur {host}`,
      text: `
Une action demandant une confirmation par email a été déclenchée sur cette adresse. Pour valider cette action copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous rencontrez un problème avec votre compte ou que vous trouvez ce message suspect, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Une action demandant une confirmation par email a été déclenchée sur cette adresse. Pour valider cette action cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.
      `,
      htmlButton: `Valider`,
      htmlCaption: `Si vous rencontrez un problème avec votre compte ou que vous trouvez ce message suspect, n'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.`
    }
  }
}
