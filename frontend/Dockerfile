# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder

# Instalar dependencias de sistema para compilar binarios nativos
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Forzar instalacion del binario nativo correcto para linux-musl
RUN npm rebuild lightningcss --update-binary || true

COPY . .
RUN npm run build

# ---- Etapa 2: Servidor (Nginx) ----
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/sistema-gestion-obras/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
