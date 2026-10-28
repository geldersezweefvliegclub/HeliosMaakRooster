# Build stage draait op het platform van de build machine (geen QEMU emulatie nodig)
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Alleen productie dependencies overhouden (allemaal pure JavaScript, dus platform onafhankelijk)
RUN npm prune --omit=dev

# Runtime stage voor het doelplatform, hierin wordt niets uitgevoerd tijdens de build
FROM node:22-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Direct node starten zodat SIGTERM de applicatie bereikt (graceful shutdown)
CMD [ "node", "dist/main.js" ]
