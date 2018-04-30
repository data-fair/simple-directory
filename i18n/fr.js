// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  title: 'Simple Directory',
  description: 'Gestion simplifiée de vos utilisateurs et vos organisations dans une architecture moderne orientée Web.',
  home: 'Accueil',
  logLink: `Se connecter / s'inscrire`,
  doc: {
    about: {
      link: 'À propos'
    },
    install: {
      link: 'Installation'
    },
    config: {
      i18nKey: 'Clé dans le fichier I18N',
      i18nVar: 'Variable d\'environnement',
      i18nVal: 'Valeur'
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
      emailCaption: `En savoir plus sur l'authentification <a href="https://koumoul.com/blog/passwordless">sans mot de passe</a>`
    }
  }
}
