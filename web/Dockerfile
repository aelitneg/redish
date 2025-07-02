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

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]

#
# Build
#
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . . 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

#
# Production Target
#
FROM base AS production
WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]