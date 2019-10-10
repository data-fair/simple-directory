## Simple Directory

*Gestion simplifiée de vos utilisateurs et vos organisations dans une architecture moderne orientée Web.*

*Simple Directory* est initialement développé par [Koumoul](https://koumoul.com) pour satisfaire nos besoins en terme de gestion des utilisateurs et des organisations dans une plateforme Web constituée de services autonomes. Nous cherchons un compromis entre des fonctionnalités puissantes dans le domaine très dense qu'est la gestion d'identité sur le Web et une simplicité maximale pour fluidifier l'expérience de maintenance, d'administration, d'intégration et d'utilisation.

Le projet est [publié en Open Source](https://github.com/koumoul-dev/simple-directory) pour instaurer la confiance par la transparence et dans l'espoir de trouver une place dans l'écosystème du logiciel libre et de développer une communauté.

### Fonctionnalités principales

  - Gestion d'une base d'utilisateurs
  - Gestion d'organisations
  - Gestion de rôles associés aux utilisateurs dans des organisations
  - Scénario d'authentification et de maintien de session robuste
  - Aide au respect des obligations liées au [RGPD](https://www.cnil.fr/fr/principes-cles/rgpd-se-preparer-en-6-etapes)

### Des bases solides

*Simple Directory* agit comme fournisseur d'identité selon le protocole [OpenID Connect](http://openid.net/connect/) tout comme les fournisseurs d'identité de [France Connect](https://franceconnect.gouv.fr/). Derrière ce protocole mature se trouve le retour d'expérience de nombreux acteurs du Web depuis de nombreuses années.

*OpenID Connect* est lui même basé sur d'autres protocoles comme [OAuth](https://oauth.net/), [JWT](https://jwt.io/) et [JWKS](https://auth0.com/docs/jwks).

La preuve d'identité basique du point de vue de *Simple Directory* n'est pas le mot de passe, mais l'accès à une boite mail. Cette approche est généralement appelée *passwordless* et nous la décrivons dans [cet article](https://koumoul.com/blog/passwordless).

En complément de l'authentification sans mot de passe basée sur les emails, le service propose également d'être client d'autres fournisseurs d'identité reconnus comme *France Connect*, *Google*, *Github*, etc.

### Adaptable et extensible

Le titre, le logo, les couleurs du thème, le contenu des emails, la langue par défaut, etc. *Simple Directory* est largement configurable pour être intégré de manière élégante dans votre système.

Le service est construit de manière à supporter l'ajout de nouveaux supports de persistance des bases d'utilisateurs et d'organisations. Nous prévoyons également d'implémenter l'intéropérabilité avec d'autres bases comme LDAP, dans ce contexte *Simple Directory* est un moyen de moderniser votre système sans le bouleverser.
