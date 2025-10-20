# Usamos una imagen base con Java 17 (ajusta la versión si usas otra)
FROM eclipse-temurin:17-jre-alpine

# Argumento para el nombre del JAR, así no tenemos que cambiarlo en cada Dockerfile
ARG JAR_FILE=target/*.jar

# Creamos un directorio para la aplicación
WORKDIR /app

# Copiamos el JAR generado por Maven al contenedor
COPY ${JAR_FILE} app.jar

COPY data/documentos.db /app/data/documentos.db

# Exponemos el puerto en el que corre el microservicio (ej. 8081, 8082, etc.)
# Este puerto debe coincidir con el 'server.port' en tu application.properties
EXPOSE 8087

# Comando para ejecutar la aplicación cuando el contenedor inicie
ENTRYPOINT ["java", "-jar", "/app/app.jar"]