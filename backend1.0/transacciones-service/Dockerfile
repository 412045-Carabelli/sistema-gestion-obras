# Usamos una imagen base con Java 17
FROM eclipse-temurin:17-jre-alpine

ARG JAR_FILE=target/*.jar

WORKDIR /app

# 📁 Crear la carpeta donde vivirá la base SQLite
RUN mkdir -p /app/data

# Copiar la base de datos si ya existe localmente
COPY data/obras.db /app/data/transacciones.db

# Copiamos el JAR
COPY ${JAR_FILE} app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
