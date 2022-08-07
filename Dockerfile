########
# BASE
########
FROM node:16-alpine as base

WORKDIR /usr/app

########
# BUILD
########
FROM base as build

# Copy all jsons
COPY package*.json tsconfig.json ./

# Add dev deps
RUN npm ci

# Copy source code
COPY src src

RUN npm run build

########
# DEPLOY
########
FROM base as deploy

RUN apk add --no-cache \
    git \
    tini

COPY package*.json ./
RUN npm ci --omit=dev

# Steal compiled code from build image
COPY --from=build /usr/app/dist dist

USER node
ENV NODE_ENV=production CONFIG_DIR=/config

VOLUME [ "/config" ]

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "/usr/app/dist/index.js" ]