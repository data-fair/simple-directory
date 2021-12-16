FROM node:16.13.0-alpine3.13
MAINTAINER "contact@koumoul.com"

RUN apk add --update openssl graphicsmagick curl

# Install node-prune to reduce size of node_modules
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | sh -s -- -b /usr/local/bin

ENV NODE_ENV production
WORKDIR /webapp
ADD LICENSE .
ADD package.json .
ADD package-lock.json .
RUN npm install --production && node-prune
ADD nodemon.json .

# Adding server files
ADD scripts scripts
ADD server server
ADD config config
ADD contract contract
ADD README.md VERSION.json* ./

# Adding UI files
ADD i18n i18n
ADD public public
ADD doc doc
ADD nuxt.config.js .
RUN npm run build

VOLUME /webapp/security
VOLUME /webapp/data
EXPOSE 8080

CMD ["node", "--max-http-header-size", "64000", "server"]
