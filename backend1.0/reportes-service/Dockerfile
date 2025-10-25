FROM openjdk:17-jdk-slim
WORKDIR /app

# Copia el JAR compilado desde el target del módulo
COPY target/*.jar app.jar
COPY data ./data
# Expone el puerto donde correrá Spring Boot
EXPOSE 8084

# Activa explícitamente el perfil "render" en el entrypoint
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=render"]
