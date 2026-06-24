# ---- Etapa 1: Build ----
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
# Forzar binario nativo correcto para linux-x64 (cache previa puede tener binarios Windows)
RUN npm install lightningcss-linux-x64-gnu@1.30.1 --no-save || true

COPY . .
RUN npm run build

# ---- Etapa 2: Servidor (Nginx) ----
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/sistema-gestion-obras/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
