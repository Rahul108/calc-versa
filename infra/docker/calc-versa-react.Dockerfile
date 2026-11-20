FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install workspace dependencies
RUN npm install --legacy-peer-deps

# Copy full monorepo source code
COPY . .

# API base URLs are inlined into the bundle at build time (see frontend/src/app/config).
ARG VITE_API_GATEWAY_URL=http://localhost:3005
ARG VITE_AI_ASSISTANT_URL=http://localhost:3006
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL \
    VITE_AI_ASSISTANT_URL=$VITE_AI_ASSISTANT_URL

# Build React SPA production assets
RUN npx nx build frontend

# Stage 2: Serve compiled React SPA via Nginx
FROM nginx:alpine

COPY --from=builder /app/dist/frontend /usr/share/nginx/html
COPY infra/docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
