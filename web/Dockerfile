# -- Build stage --
FROM node:lts-alpine AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
RUN npm ci
COPY . . 
RUN npm run build

# -- Runtime stage --
FROM node:lts-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next

CMD ["npm", "run", "start", "--", "-p", "8080"]