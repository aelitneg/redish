FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "-p", "8080"] 