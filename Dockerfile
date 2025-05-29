# Build Stage
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Production Stage
FROM node:lts-alpine

WORKDIR /app

ARG USER_ID=1001
ARG GROUP_ID=1001

RUN addgroup -S appgroup -g ${GROUP_ID} && \
    adduser -S appuser -G appgroup -u ${USER_ID}

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/src ./src
COPY --from=builder /app/web ./web

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
