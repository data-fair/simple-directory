# Contribution guidelines

## Development environment

This project uses the following stack : Mongo, Express, VueJS, NodeJS. The primary language used is javascript with the ES7 syntax.
You should use linters and beautifiers compliants with the ES7 syntax in your editor.

Switch to the appropriate nodejs version:

    nvm use

Install dependencies:

    npm install

If you use [zellij](https://zellij.dev/) you can replace all the following steps with `npm run dev-zellij`, otherwise follow the next instructions.

Run the services dependencies:

    npm run dev-deps

Run the 2 development servers with these commands et separate shells:

    npm run dev-server
    npm run dev-client

When both servers are ready, go to [http://localhost:5689](http://localhost:5689).

Test the multi-site mode:

curl -H "Content-Type: application/json" -XPOST "http://localhost:5689/simple-directory/api/sites?key=secret-sites" -d '{"_id":"devsite","owner":{"type":"organization","id":"admins-org","name":"Admins organization"},"host":"localhost:5989","theme":{"primaryColor":"#004D40"}}'
curl -H "Content-Type: application/json" -XPOST "http://localhost:5689/simple-directory/api/sites?key=secret-sites" -d '
{"_id":"devsite2","owner":{"type":"organization","id":"admins-org","name":"Admins organization"},"host":"localhost:5999","theme":{"primaryColor":"#FF4D40"}}'

## Docker image

Test building the docker image:

```
docker compose stop
npm run test-deps
docker build -t sd-dev .
// don't expect the following line to work fully, it will be missing service dependencies, etc.
docker run --network=host --env PORT=8081 sd-dev
```

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