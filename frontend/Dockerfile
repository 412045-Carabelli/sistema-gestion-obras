# ---- Etapa 1: Build (Debian, evita problemas de musl con binarios nativos) ----
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ---- Etapa 2: Servidor (Nginx) ----
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/sistema-gestion-obras/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
