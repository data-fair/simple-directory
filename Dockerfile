FROM koumoul/webapp-base:1.8.0
MAINTAINER "contact@koumoul.com"

RUN apk add --update openssl

ARG VERSION
ENV VERSION=$VERSION
ENV NODE_ENV production
WORKDIR /webapp
ADD package.json .
ADD package-lock.json .
RUN npm install --production && node-prune

# Adding UI files
ADD i18n i18n
ADD public public
ADD doc doc
ADD nuxt.config.js .
RUN npm run link-doc

# Adding server files
ADD scripts scripts
ADD server server
ADD contract contract
ADD config config
ADD README.md .

VOLUME /webapp/security
VOLUME /webapp/data
VOLUME /webapp/.nuxt
EXPOSE 8080

CMD ["node", "server"]
