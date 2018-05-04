FROM node:8.9.1-alpine
MAINTAINER "contact@koumoul.com"

ENV NODE_ENV production
WORKDIR /webapp
ADD package.json .
ADD package-lock.json .
RUN npm install --production

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
EXPOSE 8080

CMD ["node", "server"]
