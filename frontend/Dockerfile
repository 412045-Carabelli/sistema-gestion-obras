# ---- Etapa 1: Servidor (Nginx) ----
FROM nginx:alpine

# Eliminamos los archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el dist pre-compilado a Nginx
COPY dist/sistema-gestion-obras/browser /usr/share/nginx/html

# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80
EXPOSE 80
