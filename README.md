# <img alt="Data FAIR logo" src="https://cdn.jsdelivr.net/gh/data-fair/data-fair@master/ui/src/assets/logo.svg" width="40"> @data-fair/simple-directory

![GitHub License](https://img.shields.io/github/license/data-fair/simple-directory) ![GitHub package.json version](https://img.shields.io/github/package-json/v/data-fair/simple-directory)  
*Users, organizations and authentication (JSON Web Tokens) for the Data Fair stack.*

Part of the [Data Fair](https://datafair.cloud) ecosystem.

## Sponsors

<a href="https://koumoul.com"><img alt="Koumoul logo" src="https://cdn.jsdelivr.net/gh/data-fair/data-fair@master/docs/assets/koumoul-logo.png" height="56" align="left"></a>

**[Koumoul](https://koumoul.com)** · *La donnée accessible*<br>
Koumoul develops the Data Fair ecosystem and hosts it as an online service.

<br clear="left">

Click [here to support the development of this project](https://github.com/sponsors/koumoul-dev).

## Developers

Take a look at the [contribution guidelines](./CONTRIBUTING.md).

### Test API from the Docker image

Other services can seed and clean accounts in a simple-directory started from its image, to run their own test suites. The test API (`/api/test-env`) is an unauthenticated admin surface: never enable it on a reachable deployment. It refuses to start when `NODE_ENV=production`, and the image sets `NODE_ENV=production`, so run it like this (node-config reads its files from `NODE_CONFIG_ENV`, so the development configuration is not loaded):

```
docker run --rm -p 8080:8080 \
  -e NODE_ENV=development -e NODE_CONFIG_ENV=production -e ENABLE_TEST_API=1 \
  -e STORAGE_TYPE=mongo -e MONGO_URL=mongodb://mongo:27017/simple-directory \
  -e PORT=8080 -e PUBLIC_URL=http://localhost:8080 \
  -e CONTACT=admin@example.org -e CIPHER_PASSWORD=change-me-test-only \
  ghcr.io/data-fair/simple-directory:master
```

`CONTACT` and `CIPHER_PASSWORD` are required by the configuration validation, the values above are placeholders. `/app/BUILD.json` is only read when `NODE_ENV=production`, so it is not needed for this run. Readiness can be polled on `/api/test-env/ping`.

Each test suite owns a prefixed sub-space of accounts, a prefix matches `^test_[a-z0-9]+(?:_[a-z0-9]+)*_$` (for example `test_datafair_`):

- `POST /api/test-env/seed` with `{ prefix, users, organizations }` upserts the accounts and answers `200` with `{ users, organizations }`. The entries have the shape of `dev/resources/users.json` and `organizations.json` (organizations list their `members`). The ids of users, organizations and members and the emails of users must all start with the prefix, otherwise the answer is `400` and nothing is written.
- `DELETE /api/test-env?prefix=<prefix>` answers `204` after deleting the users whose id or email starts with the prefix, the organizations whose id starts with it (or created by a deleted user), their limits and avatars, the sites owned by a deleted account or whose id starts with the prefix, and the OAuth tokens of the deleted users. References to the deleted organizations are removed from the remaining users and organizations. Other sub-spaces and unprefixed accounts are left untouched.
- `POST /api/test-env/seed-dev` takes the same body without a prefix, to seed the accounts of a developer's own space. It refuses ids starting with `test_` and emails ending with `@test.com`, which the cleanups remove.

Without a prefix, `POST /api/test-env/seed` and `DELETE /api/test-env` keep their historical behavior used by this repository's own tests.
