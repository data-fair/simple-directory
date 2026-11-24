# Contribution guidelines

## Development environment

This project uses the following stack : Mongo, Express, VueJS, NodeJS. The primary language used is javascript with the ES7 syntax.
You should use linters and beautifiers compliants with the ES7 syntax in your editor.

Switch to the appropriate nodejs version (`.nvmrc`):

    nvm use

Install dependencies:

    npm ci

Start the dev environment, optionally with some optional containers (`events`, `saml-provider`, `ldap-admin`):

    npm run dev
    npm run dev -- --profile events

`npm run dev` copies `dev/default.env` to `.env` the first time (fixed ports 6050-6069; `.env` overrides them and
is never overwritten), builds the types and the UI once, starts the containers, then the api, the ui and the mock
OIDC servers in the terminal. Ctrl+C stops them, `npm run stop-dev-deps` stops the containers. The dev server is at
`http://localhost:6050/simple-directory/`, the process logs in `dev/logs/`. `npm run dev-deps` starts only the
containers; `npm run dev:api`, `dev:ui` and `dev:mock-oidc` run one process each, with the variables of `.env`
exported.

## Docker image

Test building the docker image:

```
docker build --progress=plain -t sd-dev .
// don't expect the following line to work fully, it will be missing service dependencies, etc.
```

## Working with Git Worktrees

A second checkout of the repository needs its own ports and compose project: give it a `.env` with other ports
than `dev/default.env`'s, and a `COMPOSE_PROJECT_NAME` in its environment (the folder name by default).

## Git quality checks

This project uses [husky](https://typicode.github.io/husky/) and  to ensure quality of commits. The pre-commit hook runs the docker image build, this way we get linting, testing, and building all checked in 1 step.

The original setup was created like so:

```
npm i -D husky
npm pkg set scripts.prepare="husky install"
npm run prepare
npx husky add .husky/pre-commit "npm run lint"

npm i -D @commitlint/config-conventional @commitlint/cli
echo "module.exports = { extends: ['@commitlint/config-conventional'] }" > commitlint.config.js
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit ""'
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
ldapadd -x -W -D "cn=admin,dc=example,dc=org" -f dev/resources/ldap-user.ldif
```