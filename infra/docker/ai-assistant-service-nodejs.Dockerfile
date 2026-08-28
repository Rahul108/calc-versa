FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/ai-assistant-service-nodejs/package*.json ./backend/ai-assistant-service-nodejs/

RUN cd backend/ai-assistant-service-nodejs && npm install

COPY backend/ai-assistant-service-nodejs ./backend/ai-assistant-service-nodejs

RUN cd backend/ai-assistant-service-nodejs && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/backend/ai-assistant-service-nodejs/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/backend/ai-assistant-service-nodejs/dist ./dist

EXPOSE 3004

ENV PORT=3004
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
