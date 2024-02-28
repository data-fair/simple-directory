############################################################################################################
# Stage: prepare a base image with all native utils pre-installed, used both by builder and definitive image

FROM node:20.11.1-alpine3.19 AS nativedeps

RUN apk add --no-cache openssl graphicsmagick

######################################
# Stage: nodejs dependencies and build
FROM nativedeps AS builder

WORKDIR /webapp
ADD package.json .
ADD package-lock.json .
ADD patches patches
# use clean-modules on the same line as npm ci to be lighter in the cache
RUN npm ci && \
    ./node_modules/.bin/clean-modules --yes --exclude mocha/lib/test.js --exclude "**/*.mustache"

# Adding UI files
ADD public public
ADD nuxt.config.js .
ADD config config
ADD contract contract
ADD i18n i18n

# also install deps in types submodule
ADD types types
WORKDIR /webapp

# Build UI
ENV NODE_ENV production
RUN npm run build-types
RUN npm run build

# Adding server files
ADD server server
ADD scripts scripts

# Check quality
ADD .eslintignore .eslintignore
RUN npm run lint
ADD test test
RUN npm run test
RUN npm audit --omit=dev --audit-level=critical

# Cleanup /webapp/node_modules so it can be copied by next stage
RUN npm prune --production
RUN rm -rf node_modules/.cache

##################################
# Stage: main nodejs service stage
FROM nativedeps
MAINTAINER "contact@koumoul.com"

RUN apk add --no-cache dumb-init

WORKDIR /webapp

# We could copy /webapp whole, but this is better for layering / efficient cache use
COPY --from=builder /webapp/node_modules /webapp/node_modules
COPY --from=builder /webapp/package.json /webapp/package.json
COPY --from=builder /webapp/nuxt-dist /webapp/nuxt-dist
COPY --from=builder /webapp/types /webapp/types
ADD nuxt.config.js nuxt.config.js
ADD i18n i18n
ADD server server
ADD scripts scripts
ADD config/default.js config/
ADD config/production.js config/
ADD config/custom-environment-variables.js config/
ADD contract contract

# Adding licence, manifests, etc.
ADD README.md BUILD.json* ./
ADD LICENSE .
ADD nodemon.json .

# configure node webapp environment
ENV NODE_ENV production
ENV DEBUG db,upgrade*
# the following line would be a good practice
# unfortunately it is a problem to activate now that the service was already deployed
# with volumes belonging to root
#USER node
VOLUME /webapp/data
VOLUME /webapp/security
EXPOSE 8080

CMD ["dumb-init", "node", "--max-http-header-size", "64000", "server"]

