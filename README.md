# Simple directory

[Documentation](https://koumoul-dev.github.io/simple-directory/).

This service aims to provide easy access to user and organizations structures and authentication mechanism using Json Web tokens.

[![Build Status](https://travis-ci.org/koumoul-dev/simple-directory.svg?branch=master)](https://travis-ci.org/koumoul-dev/simple-directory)
[![Coverage Status](https://coveralls.io/repos/github/koumoul-dev/simple-directory/badge.svg?branch=master)](https://coveralls.io/github/koumoul-dev/simple-directory?branch=master)

## Development environment

This project uses the following stack : Mongo, Express, VueJS, NodeJS. The primary language used is javascript with the ES7 syntax.
You should use linters and beautifiers compliants with the ES7 syntax in your editor.

Install dependencies and run bundler:

    npm install
    npm run build

Run the services dependencies:

    npm run dev-deps

Run the 2 development servers with these commands et separate shells:

    npm run dev-server
    npm run dev-client

When both servers are ready, go to [http://localhost:5689](http://localhost:5689).

Test built nuxt distributable in dev:

   # first set proxyNuxt to false in config/development.js
   NODE_ENV=development npm run build
   npm run dev-server

Test building the docker image:

```
docker build --network=host -t sd-dev .
// don't expect the following line to work fully, it will be missing service dependencies, etc.
docker run --network=host --env PORT=8081 sd-dev
```

## Design

The application applies the material design recommendations and uses vue and vuetify

## Embedded documentation

Documentation is maintained in ./doc as a small separate nuxt project. Its content is built and pushed on gitlab-pages by the Travis build.

The pages are also linked to the main nuxt project, so that any Simple Directory instance embeds its full documentation.

Run the documentation development server:

```
npm run doc
```

Then open http://localhost:3000/simple-directory/

## Work on LDAP storage

Edit config/development.js to use LDAP storage.

Open https://localhost:6443 and login using "cn=admin,dc=example,dc=org" and "admin".

Add a test user:

```
apt-get install ldap-utils
ldapadd -x -W -D "cn=admin,dc=example,dc=org" -f test/resources/ldap-user.ldif
```