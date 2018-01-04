# Simple directory
This service aims to provide easy access to user and organizations structures and authentication mechanism using Json Web tokens.

[![Build Status](https://travis-ci.org/koumoul-dev/simple-directory.svg?branch=master)](https://travis-ci.org/koumoul-dev/simple-directory)
[![Coverage Status](https://coveralls.io/repos/github/koumoul-dev/simple-directory/badge.svg?branch=master)](https://coveralls.io/github/koumoul-dev/simple-directory?branch=master)

## Development environment
This project uses the following stack : Mongo, Express, VueJS, NodeJS. The primary language used is javascript with the ES7 syntax.
You should use linters and beautifiers compliants with the ES7 syntax in your editor.

Install dependencies and run bundler:
```
npm install
npm run build
```

Run a development server with nodemon, webpack and browser-sync all watching, bundling, hot-reloading, etc:
```
npm run dev
```

### Generating public and private keys

```
mkdir resources
openssl genpkey -algorithm RSA -out ./resources/default.key -pkeyopt rsa_keygen_bits:2048
openssl rsa -in ./resources/default.key -outform PEM -pubout -out  ./resources/default.key.pub
```


## Design

The application applies the material design recommendations and uses vue and vue-material
