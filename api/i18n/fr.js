// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Gestion simplifiée de vos utilisateurs et vos organisations dans une architecture moderne orientée Web.'
  },
  common: {
    home: 'Accueil',
    logLink: 'Se connecter / s\'inscrire',
    logout: 'Se déconnecter',
    login: 'Se connecter',
    signin: 'Créer un compte',
    activateAdminMode: 'Activer mode admin',
    deactivateAdminMode: 'Désactiver mode admin',
    documentation: 'Documentation',
    administration: 'Administration',
    myAccount: 'Informations personnelles',
    myOrganizations: 'Vos organisations',
    organization: 'Organisation',
    organizations: 'Organisations',
    organizationName: 'Nom de l\'organisation',
    user: 'Utilisateur',
    users: 'Utilisateurs',
    createOrganization: 'Créer une organisation',
    dashboard: 'Tableau de bord',
    description: 'Description',
    id: 'Identifiant',
    name: 'Nom',
    save: 'Enregistrer',
    members: 'Membres',
    orgStorageMembers: 'Membres dans le stockage secondaire',
    role: 'Rôle',
    search: 'Rechercher',
    confirmOk: 'Ok',
    confirmCancel: 'Annuler',
    confirmTitle: 'Souhaitez-vous confirmer cette opération ?',
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
    host: 'Site',
    sites: 'Sites',
    updatedAt: 'Mis à jour le',
    maxCreatedOrgs: 'Nombre maximal d\'organisations à créer',
    maxCreatedOrgsShort: 'Nb orga max',
    nbCreatedOrgs: 'Nombre d\'organisations créées :',
    back: 'Retour',
    next: 'Suivant',
    password: 'Mot de passe',
    checkInbox: 'Vérifiez votre boite mail',
    spamWarning: 'Si vous n\'avez pas reçu de mail, vérifiez qu\'il n\'a pas été classé automatiquement en tant que spam.',
    validate: 'Valider',
    delete: 'Supprimer',
    department: 'Département',
    departments: 'Départements',
    autoAdmin: 'M\'ajouter automatiquement comme administrateur',
    asAdmin: 'Se connecter en tant que cet utilisateur',
    delAsAdmin: 'Revenir à ma session administrateur',
    avatar: 'Avatar',
    birthday: 'Anniversaire',
    missingInfo: 'Information manquante',
    '2FA': 'Authentification 2 facteurs',
    userAccount: 'Compte personnel',
    continue: 'Continuer',
    tooLong: 'texte trop long',
    settings: 'paramètres',
    emailConfirmed: 'création finalisée',
    emailNotConfirmed: 'création non finalisée',
    noRole: 'aucun role',
    downloadCsv: 'télécharger la liste au format CSV',
    authMode: 'Mode d\'authentification',
    authProviders: 'Fournisseurs d\'identitié',
    partners: 'Organisations partenaires',
    contactEmail: 'Email de contact',
    orgName: 'Nom de l\'organisation',
    loginSignin: 'Se connecter / créer un compte',
    sort: 'Tri',
    all: 'tous',
    creationStep: 'Étape de création',
    oauthTokens: 'Jetons OAUTH',
    plannedDeletion: 'Suppression programmée',
    plannedDeletionShort: 'Suppr prog',
    owner: 'Propriéraire',
    passwordLists: 'Mots de passe',
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
      i18nVar: 'Variable d\'environnement',
      i18nVal: 'Valeur',
      varKey: 'Clé dans le fichier de configuration',
      varName: 'Variable d\'environnement',
      varDesc: 'Description',
      varDefault: 'Valeur par défaut',
      varDescriptions: {
        publicUrl: '<b>IMPORTANT.</b> L\'URL à laquelle le service sera exposé. Par exemple https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANT.</b> La liste des adresses mails des administrateurs du service.',
        contact: '<b>IMPORTANT.</b> L\'adresse mail de contact pour les utilisateurs du service.',
        theme: {
          logo: 'L\'URL du logo à utiliser pour remplacer le logo par défaut de <i>Simple Directory</i>.',
          dark: 'Rendre l\'apparence complète des pages sombre.<br>Notez que les couleurs par défaut sont plus adaptées à un thème clair. Si vous passez en sombre vous allez devoir également modifier ces couleurs.',
          cssUrl: 'Lien vers une feuille de style pour compléter les variables de personnalisation.<br>ATTENTION: la structure HTML peut varier de manière importante entre 2 versions. Maintenir cette feuille de style va vous créer du travail supplémentaire à chaque montée en version.',
          cssText: 'Contenu CSS textuel.<br>ATTENTION: la structure HTML peut varier de manière importante entre 2 versions. Maintenir cette feuille de style va vous créer du travail supplémentaire à chaque montée en version.'
        },
        secret: {
          public: '<b>IMPORTANT.</b> Le chemin vers la clé publique de chiffrement RSA. Voir la documentation d\'installation du service.',
          private: '<b>IMPORTANT.</b> Le chemin vers la clé privée de chiffrement RSA. Voir la documentation d\'installation du service.'
        },
        analytics: 'JSON de configuration des analytics, correspond à la partie "modules" de configuration de la librairie <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>IMPORTANT.</b> Le type de stockage pour la persistance des utilisateurs et des organisations.<br>
Le type "file" par défaut est lecture seule et est adapté en développement/test ou pour utiliser une collection d'utilisateurs exportée depuis un autre système.<br>
Le type "mongo" dépend d'un accès à une base de données MongoDB, c'est le mode approprié pour la plupart des installations en production.`,
          file: {
            users: 'Uniquement pour storage.type=file. Le chemin du fichier JSON contenant les définitions d\'utilisateurs',
            organizations: 'Uniquement pour storage.type=file. Le chemin du fichier JSON contenant les définitions d\'organisations'
          },
          mongo: {
            url: 'Uniquement pour storage.type=mongo. La chaine de connexion complète à la base de données mongodb.'
          }
        },
        mails: {
          transport: '<b>IMPORTANT.</b> Un objet JSON de configuration du transport mail compatible avec la librairie <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '\'<b>IMPORTANT.</b> L\'adresse à renseigner comme expéditeur des mails émis par le service.'
        },
        listEntitiesMode: `Permet de restreindre de manière globale l'accès aux listes d'utilisateurs et d'organisations.<br>
Peut valoir 'anonymous', 'authenticated' ou 'admin'.`,
        defaultLoginRedirect: 'Redirection par défaut après login. Si non spécifié l\'utilisateur sera redirigé vers son profil.',
        onlyCreateInvited: 'Si vrai les utilisateurs ne seront pas créés au premier email envoyé. Ils doivent être invités dans une organisation.',
        tosUrl: '<b>IMPORTANT.</b> Une URL vers vos conditions générales d\'utilisation. Si ce paramètre n\'est pas défini et ne pointe pas vers une page Web correcte vous risquez de ne pas respecter vos obligations vis à vis de vos utilisateurs.'
      }
    },
    use: {
      link: 'Utilisation'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Les utilisateurs peuvent créer un nombre indéfini d\'organisations.',
        createdOrgsLimit: 'Les utilisateurs peuvent créer {defaultMaxCreatedOrgs} organisation(s) par défaut.',
        explainLimit: 'Définissez une valeur pour limiter le nombre d\'organisations que cet utilisateur peut créer. -1 pour un nombre indéterminé. Videz le champs pour retomber sur la valeur par défaut ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Changez l\'adresse email de l\'utilisateur {name}',
        editUserEmailText: 'Attention ! L\'email est une clé importante de l\'utilisateur, en modifiant cette information vous courez le risque d\'insérer une adresse erronée, non fonctionnelle ou incohérente avec d\'autres saisies. Cette fonctionnalité est présentée uniquement aux administrateurs pour débloquer un utilisateur dont la boite mail devient inaccessible.',
        drop2FATitle: 'Effacer la configuration d\'authentification 2 facteurs de l\'utilisateur {name}',
        drop2FAExplain: 'Attention ! Cette opération est réservée au débloquage d\'un utilisateur qui a à la fois perdu son appareil et son code de récupération pour l\'authentification 2 facteurs. Avant de continuer il est fortement recommandé de s\'assurer d\'une manière ou d\'une autre de l\'identité de la personne qui fait la demande (contacter un collègue membre d\'une même organisation par exemple).'
      },
      organizations: {
        limitOrganizationTitle: 'Modifiez les limites de l\'organisation',
        members: 'membre(s)',
        nbMembers: 'Nombre maximal de membres (0 pour aucune limite)'
      },
      sites: {
        createSite: 'Déclarer un nouveau site',
        colorWarnings: 'Avertissements de contraste',
      }
    },
    login: {
      title: 'Identifiez vous',
      emailLabel: 'Adresse mail',
      emailCaption: 'En savoir plus sur l\'authentification <a href="https://koumoul.com/blog/passwordless">sans mot de passe</a>',
      success: 'Vous allez recevoir un email à l\'adresse renseignée qui contiendra un lien. Veuillez ouvrir ce lien pour terminer votre identification.',
      maildevLink: 'Accédez à la boite mail de développement',
      newPassword: 'Nouveau mot de passe',
      newPassword2: 'Confirmez le nouveau mot de passe',
      changePassword: 'Renouveler le mot de passe',
      changePasswordTooltip: 'En cas d\'oubli de votre mot de passe ou de besoin de modification de celui-ci, renouvelez votre mot de passe.',
      newPasswordMsg: 'Saisissez 2 fois le nouveau mot de passe.',
      changePasswordSent: 'Un email vous a été envoyé à l\'adresse {email}. Cet email contient un lien pour modifier le mot de passe associé à votre compte.',
      passwordlessMsg1: 'Pour vous connecter un email suffit.',
      passwordlessMsg2: 'Envoyer un email de connexion.',
      passwordlessConfirmed: 'Un email vous a été envoyé à l\'adresse {email}. Cet email contient un lien pour vous connecter sur notre plateforme.',
      createUserMsg1: 'Si vous ne vous êtes pas encore connecté à notre plateforme veuillez créer un compte.',
      createUserMsg2: 'Créer un compte',
      createUserInvit: 'Créez un compte pour accepter l\'invitation dans l\'organisation {name}',
      createUserOrganization: 'Souhaitez vous créer une organisation ?',
      createUserOrganizationHelp: 'Si vous créez une organisation vous pourrez inviter d\'autres utilisateurs à vous rejoindre et à partager vos ressources.',
      tosMsg: 'Avant de créer votre compte veuillez prendre connaissance de <a href="{tosUrl}" target="_blank">nos conditions générales d\'utilisation</a>.',
      tosConfirm: 'Je confirme avoir lu les conditions générales d\'utilisation pour ce site.',
      createUserConfirm: 'Créer le compte',
      createUserConfirmed: 'Un email vous a été envoyé à l\'adresse {email}. Cet email contient un lien pour valider la création du compte.',
      adminMode: 'Confirmez votre identité pour passer en mode administration.',
      oauth: 'Connectez vous avec :',
      error: 'Erreur',
      rememberMe: 'se souvenir de moi',
      '2FACode': 'Code à 6 chiffres ou code de récupération',
      '2FAInfo': 'Saisissez un code de vérification pour continuer. Vous pouvez obtenir ce code depuis l\'application de vérification sur votre téléphone. En cas de perte de votre appareil vous pouvez utiliser le code récupération téléchargé à la configuration de l\'authentification à 2 facteurs.',
      configure2FA: 'Configurer l\'authentification à 2 facteurs',
      configure2FAQRCode: 'qr code de configuration de l\'authentification 2 facteurs',
      configure2FAQRCodeMsg: 'Scannez ce QR code avec un outil d\'authentification de votre choix (comme Authy ou Google Authenticator) puis saisissez le code à 6 chiffres proposé par cette application.',
      configure2FACode: 'Code à 6 chiffres',
      recovery2FA: 'Code de récupération',
      recovery2FAInfo: 'Attention ! Le code de récupération ci-dessous est à conserver précieusement. Sans lui vous ne pourrez pas récupérer votre compte en cas de perte de l\'appareil sur lequel vous venez de configurer l\'authentification à 2 facteurs.',
      recovery2FACode: 'code de récupération : ',
      recovery2FADownload: 'télécharger un fichier contenant le code de récupération',
      recovery2FAContent: 'Code de récupération authentification 2 facteurs {name}',
      plannedDeletion: 'Suppression programmée',
      cancelDeletion: 'Annuler la suppression de l\'utilisateur',
      siteLogo: 'Logo du site',
      partnerInvitation: 'Invitation partenaire',
      changeHost: 'Compte associé au back-office'
    },
    organization: {
      addMember: 'Inviter un utilisateur à rejoindre l\'organisation',
      disableInvite: 'Cette organisation a atteint son nombre maximal de membres.',
      deleteMember: 'Supprimer cet utilisateur de la liste des membres de l\'organisation',
      editMember: 'Modifier le rôle de cet utilisateur dans l\'organisation',
      memberReadOnly: 'L\'appartenance de cet utilisateur à l\'organisation est issue d\'un fournisseur d\'identité et ne peut pas être modifiée ici.',
      confirmEditMemberTitle: 'Modifier {name}',
      confirmDeleteMemberTitle: 'Exclure {name}',
      confirmDeleteMemberMsg: 'Voulez vous vraiment supprimer cet utilisateur de la liste des membres de l\'organisation {org} ?',
      deleteMemberSuccess: 'L\'utilisateur {name} a été exclu de l\'organisation',
      inviteEmail: 'Adresse mail de l\'utilisateur',
      inviteSuccess: 'Une invitation a été envoyée à l\'adresse {email}',
      invitePartnerSuccess: 'Une invitation a été envoyé à l\'adresse {email}',
      memberConflict: 'Cet utilisateur est déjà membre',
      departmentLabelTitle: 'Libellé du concept "département"',
      departmentLabelHelp: 'Laissez vide pour afficher "département". Renseignez pour utiliser un autre vocabulaire comme "service", "agence", etc.',
      addDepartment: 'Créer {departmentLabel}',
      editDepartment: 'Modifier {departmentLabel}',
      deleteDepartment: 'Supprimer {departmentLabel}',
      confirmEditDepartmentTitle: 'Modifier {name}',
      confirmDeleteDepartmentTitle: 'Supprimer {name}',
      confirmDeleteDepartmentMsg: 'Voulez vous vraiment supprimer {name} de votre organisation ?',
      deleteDepartmentHasMembers: 'Ce département est affecté à {count} membre(s) de l\'organisation. Vous ne pouvez pas le supprimer avant d\'avoir corrigé cette situation.',
      departmentIdInvalid: 'L\'identifiant ne doit contenir que des lettres, nombres et espaces.',
      inviteLink: 'En cas de problème dans la communication par email vous pouvez envoyer le lien de confirmation ci-dessous par un autre moyen. Attention ! Vous risquez d\'insérer dans la base utilisateur une adresse mail erronée ou non fonctionnelle. Cette adresse mail pourra poser de multiples problèmes par la suite : changement de mot de passe, envoi d\'alertes, etc.',
      '2FARoles': 'Authentification à 2 facteurs.',
      '2FARolesMsg': 'Rendre obligatoire l\'authentification à 2 facteurs pour les utilisateurs possédant ces rôles.',
      sendInvitationLink: 'Renvoyer un lien d\'invitation',
      addPartner: 'Inviter une organisation partenaire',
      deletePartner: 'Supprimer ce partenaire',
      depSortCreation: 'Derniers créés',
      depSortAlpha: 'Ordre alphabétique'
    },
    invitation: {
      title: 'Invitation validée',
      msgSameUser: 'Votre invitation à être membre d\'une organisation a bien été acceptée. Vous pouvez consulter <a href="{profileUrl}">votre profil</a>.',
      msgDifferentUser: 'Cette invitation à être membre d\'une organisation a bien été acceptée. Vous pouvez <a href="{loginUrl}">vous connecter</a> avec le compte invité.'
    },
    avatar: {
      load: 'chargez un nouvel avatar',
      prepare: 'Préparez l\'image'
    },
    me: {
      noOrganization: 'Vous n\'êtes membre d\'aucune organisation.',
      operations: 'Opérations sensibles',
      deleteMyself: 'Supprimer l\'utilisateur {name}',
      deleteMyselfAlert: 'Si vous supprimez votre compte utilisateur vous disposerez d\'un délai de {plannedDeletionDelay} jours pour annuler l\'opération, après quoi toutes les données associées seront supprimées et ne pourront plus être récupérées.',
      deleteMyselfCheck: 'cochez cette case et cliquez sur OK pour confirmer la suppression de l\'utilisateur {name} et toutes ses données.',
      accountChanges: 'Gestion des changements de compte',
      defaultOrg: 'Activer ce compte par défaut à chaque connexion',
      ignorePersonalAccount: 'Cochez cette case si vous ne souhaitez jamais utiliser la plateforme en dehors d\'une organisation',
      sessions: 'Vos sessions',
      deleteSession: 'Supprimer la session sur {deviceName} ?',
      deleteSessionWarning: 'La suppression de session peut mettre un délai maximal de {duration} à être entièrement appliquée.',
      settings: 'Vos paramètres'
    }
  },
  errors: {
    badEmail: 'Adresse mail non renseignée ou malformée.',
    badProviderInvitEmail: 'L\'adresse mail que vous venez d\'utiliser pour vous connecter ne correspond pas à celle de l\'invitation que vous avez reçu',
    maxCreatedOrgs: 'L\'utilisateur ne peut pas créer plus d\'organisations. Quota atteint.',
    permissionDenied: 'Permissions insuffisantes.',
    nonEmptyOrganization: 'Il faut supprimer les autres membres de l\'organisation',
    userUnknown: 'Utilisateur inconnu.',
    orgaUnknown: 'Organisation inconnue.',
    invitationConflict: 'Cet utilisateur est déjà membre de cette organisation.',
    unknownRole: 'Rôle {role} inconnu.',
    serviceUnavailable: 'Service indisponible pour cause de maintenance.',
    badCredentials: 'Adresse email ou mot de passe invalide.',
    updatePassword: 'Le mot de passe doit être renouvelé.',
    missingToken: 'Le paramètre id_token est manquant.',
    invalidToken: 'Le jeton n\'est pas valide. Il est peut-être périmé.',
    differentPasswords: 'Les mots de passe sont différents',
    noPasswordless: 'L\'authentification sans mot de passe n\'est pas acceptée par ce service.',
    rateLimitAuth: 'Trop de tentatives dans un bref interval. Veuillez patienter avant d\'essayer de nouveau.',
    invalidInvitationToken: 'Le lien d\'invitation que vous avez reçu est invalide.',
    expiredInvitationToken: 'Le lien d\'invitation que vous avez reçu est expiré, vous ne pouvez plus accepter cette invitation.',
    maxNbMembers: 'L\'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.',
    unknownOAuthProvider: 'Identification OAuth non supportée.',
    unknownSAMLProvider: 'Identification SAML non supportée.',
    adminModeOnly: 'Fonctionnalité réservée aux super-administrateurs.',
    '2FANotConfigured': 'L\'authentification à 2 facteurs est nécessaire pour ce compte et n\'est pas encore configurée.',
    passwordless2FA: 'L\'authentification sans mot de passe est incompatible avec l\'authentification à 2 facteurs requise pour ce compte.',
    bad2FAToken: 'Code de vérification erroné ou périmé pour l\'authentification à 2 facteurs',
    plannedDeletion: 'La suppression de l\'utilisateur {name} et toutes ses informations est programmée le {plannedDeletion}.',
    onlyCreateInvited: 'Impossible de créer un utilisateur en dehors d\'une invitation.',
    badIDPQuery: 'Requête considérée comme invalide par le fournisseur d\'identité.',
    duplicateDep: 'Le nouveau département est un doublon',
    passwordEntropy: 'Le mot de passe est trop faible.',
    passwordMinLength: 'Le mot de passe doit contenir au moins {minLength} caractères.',
    passwordMinCharClasses: 'Le mot de passe doit contenir au moins {minCharClasses} classes de caractères (minuscule, majuscule, nombre, caractère spécial).',
    forbiddenPassword: 'Le mot de passe a été trouvé dans une liste de mots de passe connus et ne peut pas être utilisé.',
    samePassword: 'Le nouveau mot de passe doit être différent de l\'ancien.',
  },
  mails: {
    creation: {
      subject: 'Bienvenue sur {host}',
      text: `
Une demande de création de compte a été faite depuis {host} pour cette adresse email. Pour activer le compte vous devez copier l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à créer un compte sur {host}, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: 'Une demande de création de compte a été faite depuis <a href="{origin}">{host}</a> pour cette adresse email. Pour la confirmer cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.',
      htmlButton: 'Valider la création de compte',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'Si vous avez un problème avec votre compte ou si vous n\'avez pas demandé à vous connecter à <a href="{origin}">{host}</a>, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identification sur {host}',
      text: `
Une demande d'identification a été faite depuis {host}. Pour la confirmer, copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous avez un problème avec votre compte ou si vous n'avez pas demandé à vous connecter à {host}, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: 'Une demande d\'identification a été faite depuis <a href="{origin}">{host}</a>. Pour la confirmer cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.',
      htmlButton: 'Connexion à {host}',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'Si vous avez un problème avec votre compte ou si vous n\'avez pas demandé à vous connecter à <a href="{origin}">{host}</a>, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Échec d\'authentification sur {host}',
      text: `
Une demande d'identification a été faite depuis {host}, mais elle a été rejetée car cette adresse email est inconnue ou n'a pas été validée.

N'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: 'Une demande d\'identification a été faite depuis <a href="{origin}">{host}</a>, mais elle a été rejetée car cette adresse email est inconnue ou n\'a pas été validée.',
      htmlCaption: 'N\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Échec de création de compte sur {host}',
      text: `
Une demande de création de compte a été faite depuis {host}, mais elle a été rejetée car cette adresse email est déjà associée à un compte.

N'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: 'Une demande de création de compte a été faite depuis <a href="{origin}">{host}</a>, mais elle a été rejetée car cette adresse email est déjà associée à un compte.',
      htmlCaption: 'N\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Rejoignez l\'organisation {organization} sur {host}',
      text: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 10 jours.

{link}

Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Un administrateur de l'organisation {organization} vous a invité à la rejoindre. Pour accepter cette invitation cliquez sur le bouton ci-dessous. Le lien est valide 10 jours.
      `,
      htmlButton: 'Accepter l\'invitation',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'L\'organisation {organization} sur {host} souhaite ajouter {partner} comme partenaire',
      text: `
Un administrateur de l'organisation {organization} vous invite en tant que contact de l'organisation {partner} à la rejoindre sur {host}. Pour accepter cette invitation copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 10 jours.

{link}

Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Un administrateur de l'organisation {organization} vous invite en tant que contact de l'organisation {partner} à la rejoindre sur {host}. Pour accepter cette invitation cliquez sur le bouton ci-dessous. Le lien est valide 10 jours.
      `,
      htmlButton: 'Accepter l\'invitation',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'Si vous rencontrez un problème avec votre compte ou que vous trouvez cette invitation suspecte, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Effectuez une action sur votre compte sur {host}',
      text: `
Une action demandant une confirmation par email a été déclenchée sur cette adresse. Pour valider cette action copiez l'URL ci-dessous dans un navigateur. Cette URL est valide 15 minutes.

{link}

Si vous rencontrez un problème avec votre compte ou que vous trouvez ce message suspect, n'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: `
Une action demandant une confirmation par email a été déclenchée sur cette adresse. Pour valider cette action cliquez sur le bouton ci-dessous. Le lien est valide 15 minutes.
      `,
      htmlButton: 'Valider',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'Si vous rencontrez un problème avec votre compte ou que vous trouvez ce message suspect, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Suppression de compte planifiée sur {host}',
      text: `
L'utilisateur {user} sera définitivement supprimé le {plannedDeletion} avec toutes les données qui lui sont associées. {cause}

Pour annuler cette suppression vous pouvez vous connecter à ce lien {link}.

N'hésitez pas à nous contacter à {contact}.
      `,
      htmlMsg: 'L\'utilisateur {user} sera définitivement supprimé le {plannedDeletion} avec toutes les données qui lui sont associées. {cause}',
      htmlButton: 'Connectez vous pour annuler la suppression',
      htmlAlternativeLink: 'Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier ce lien dans la barre d\'adresse de votre navigateur :',
      htmlCaption: 'N\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Cette opération a été déclenchée automatiquement car ce compte est inactif depuis le {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'une invitation est envoyée',
    sentInvitation: 'Un email a été envoyé à {email} avec une invitation à rejoindre l\'organisation {orgName}.',
    acceptedInvitationTopic: 'une invitation est acceptée',
    acceptedInvitation: 'L\'utilisateur {name} ({email}) a rejoint l\'organisation {orgName}.',
    sentPartnerInvitationTopic: 'une invitation de partenaire est envoyée',
    sentPartnerInvitation: 'Un email a été envoyé à {email} avec une invitation pour l\'organisation {partnerName} à rejoindre l\'organisation {orgName} en tant que partenaire.',
    acceptedPartnerInvitationTopic: 'une invitation de partenaire est acceptée',
    acceptedPartnerInvitation: 'L\'organisation {partnerName} ({email}) a rejoint l\'organisation {orgName} en tant que partenaire.',
    addMemberTopic: 'un membre a été ajouté',
    addMember: 'L\'utilisateur {name} ({email}) a rejoint l\'organisation {orgName}.'
  },
  colors: {
    theme: {
      default: 'par défaut',
      dark: 'sombre',
      hc: 'à contraste élevé',
      hcDark: 'sombre à contraste élevé'
    },
    readableWarning: 'la couleur {colorName} ({colorCode}) du thème {themeName} n\'est pas suffisamment lisible par dessus la couleur {bgColorName} ({bgColorCode})',
    authProvider: 'du fournisseur d\'identité {title}',
    white: 'blanche',
    text: 'de texte',
    background: 'd\'arrière plan',
    surface: 'de surface',
    primary: 'primaire',
    'text-primary': 'texte primaire',
    secondary: 'secondaire',
    'text-secondary': 'texte secondaire',
    accent: 'accentuée',
    'text-accent': 'texte accentué',
    error: 'd\'erreur',
    'text-error': 'texte d\'erreur',
    warning: 'd\'avertissement',
    'text-warning': 'texte d\'avertissement',
    success: 'de succès',
    'text-success': 'texte de succès',
    info: 'd\'information',
    'text-info': 'texte d\'information',
    admin: 'd\'administration',
    'text-admin': 'texte d\'administration',
  }
}
