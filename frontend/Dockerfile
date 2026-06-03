FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is injected at build time via Railway env vars
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Serve the static build with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback — PORT substituted at container start (Railway injects $PORT)
RUN printf 'server {\n  listen __PORT__;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location /api/ {\n    return 404;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

ENV PORT=80
EXPOSE 80
CMD sh -c "sed -i \"s/__PORT__/${PORT}/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
