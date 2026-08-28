FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/ai-assistant-service-nodejs/package*.json ./backend/ai-assistant-service-nodejs/

WORKDIR /app/backend/ai-assistant-service-nodejs
RUN npm install --legacy-peer-deps

COPY backend/ai-assistant-service-nodejs ./

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=development

CMD ["npm", "run", "start:dev"]
