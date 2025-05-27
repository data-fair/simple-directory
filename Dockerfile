##########################
FROM node:22.14.0-alpine3.21 AS base

RUN npm install -g npm@11.1.0

WORKDIR /app
ENV NODE_ENV=production

##########################
FROM base AS native-deps

RUN apk add --no-cache openssl graphicsmagick

##########################
FROM base AS package-strip

RUN apk add --no-cache jq moreutils
ADD package.json package-lock.json ./
# remove version from manifest for better caching when building a release
RUN jq '.version="build"' package.json | sponge package.json
RUN jq '.version="build"' package-lock.json | sponge package-lock.json

##########################
FROM base AS installer

RUN apk add --no-cache python3 make g++ git jq moreutils
RUN npm i -g clean-modules@3.0.4
COPY --from=package-strip /app/package.json package.json
COPY --from=package-strip /app/package-lock.json package-lock.json
ADD ui/package.json ui/package.json
ADD api/package.json api/package.json
ADD shared/package.json shared/package.json
# full deps install used for types and ui building
# also used to fill the npm cache for faster install of api deps
RUN npm ci --omit=dev --omit=optional --omit=peer --no-audit --no-fund

##########################
FROM installer AS types

ADD api/types api/types
ADD api/doc api/doc
ADD api/config api/config
RUN npm run build-types

##########################
FROM installer AS ui

RUN npm i --no-save @rollup/rollup-linux-x64-musl
COPY --from=types /app/api/config api/config
COPY --from=types /app/api/types api/types
COPY --from=types /app/api/doc api/doc
ADD /api/i18n api/i18n
ADD /shared shared
ADD /api/src/config.ts api/src/config.ts
ADD /api/src/ui-config.ts api/src/ui-config.ts
ADD /ui ui
COPY --from=types /app/ui/src/components/vjsf ui/src/components/vjsf

RUN npm -w ui run build

##########################
FROM installer AS api-installer

RUN npm ci -w api --prefer-offline --omit=dev --omit=optional --omit=peer --no-audit --no-fund && \
    npx clean-modules --yes "!ramda/src/test.js"
RUN mkdir -p /app/api/node_modules

##########################
FROM native-deps AS main

COPY --from=api-installer /app/node_modules node_modules
ADD /api api
ADD /shared shared
ADD /upgrade upgrade
COPY --from=types /app/api/types api/types
COPY --from=types /app/api/doc api/doc
COPY --from=types /app/api/config api/config
COPY --from=api-installer /app/api/node_modules api/node_modules
COPY --from=ui /app/ui/dist ui/dist
ADD package.json README.md LICENSE BUILD.json* ./

EXPOSE 8080
EXPOSE 9090

USER node
WORKDIR /app/api

ENV DEBUG upgrade*

CMD ["node", "--max-http-header-size", "65536", "--experimental-strip-types", "index.ts"]
