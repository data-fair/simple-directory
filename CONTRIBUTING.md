# Contribution guidelines

## Development environment

This project uses the following stack : Mongo, Express, VueJS, NodeJS. The primary language used is javascript with the ES7 syntax.
You should use linters and beautifiers compliants with the ES7 syntax in your editor.

Switch to the appropriate nodejs version (`.nvmrc`):

    nvm use

Install dependencies and set the checkout up (`.env` with free ports, types, UI build):

    npm ci
    npx --no df-dev setup

Start the dev environment in a [zellij](https://zellij.dev/) (>= 0.44) session, optionally with some optional containers (`events`, `saml-provider`, `ldap-admin`):

    npm run dev-zellij
    npm run dev-zellij -- --services events

## Docker image

Test building the docker image:

```
docker build --progress=plain -t sd-dev .
// don't expect the following line to work fully, it will be missing service dependencies, etc.
```

## Working with Git Worktrees

Each worktree gets its own `.env`, docker compose project and ports, so several branches run concurrently. From the main checkout: `npx --no df-worktree <branch-name>` creates `../simple-directory_<branch-name>` (npm ci + setup), `npx --no df-worktree-delete <branch-name>` removes it with its containers and volumes.

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