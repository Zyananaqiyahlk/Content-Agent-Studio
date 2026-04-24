FROM node:20-alpine
WORKDIR /app

# Build context is repo root — copy only backend files
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

EXPOSE 3001
CMD ["node", "server.js"]
