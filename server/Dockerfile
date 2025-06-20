# -- Build stage --
FROM node:lts-alpine AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:lts-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

COPY drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

CMD ["node", "dist/server.js"] 