# ---- Etapa 1: Construcción (Build) ----
# Usamos una imagen de Node para compilar el proyecto Angular
FROM node:18-alpine as build

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install -g @angular/cli
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos la aplicación Angular en modo producción
RUN npm run build

# ---- Etapa 2: Servidor (Nginx) ----
FROM nginx:alpine

# Eliminamos los archivos por defecto de Nginx (como el index.html azul)
RUN rm -rf /usr/share/nginx/html/*

# Copiamos los archivos de la build de Angular a la carpeta pública de Nginx
COPY --from=build /usr/src/app/dist/sistema-gestion-obras/browser /usr/share/nginx/html

# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (el puerto por defecto de Nginx)
EXPOSE 80
