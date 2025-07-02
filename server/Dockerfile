#
# Base Image
#
FROM node:lts-alpine AS base

#
# Dependencies
#
FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

#
# Development Target
#
FROM deps AS development
WORKDIR /app

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

CMD ["npm", "run", "dev"]

#
# Build
#
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

#
# Production Target
#
FROM base AS production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./src

COPY drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/db ./src/db

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["node", "src/server.js"]