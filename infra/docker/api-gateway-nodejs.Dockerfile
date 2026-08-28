FROM node:20-alpine

WORKDIR /app

# Copy shared library dependencies and package files
COPY package*.json ./
COPY libs/db ./libs/db
COPY backend/api-gateway-nodejs/package*.json ./backend/api-gateway-nodejs/

WORKDIR /app/backend/api-gateway-nodejs
RUN npm install --legacy-peer-deps

COPY backend/api-gateway-nodejs ./

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=development

CMD ["sh", "-c", "npm run build && npm run start:dev"]
