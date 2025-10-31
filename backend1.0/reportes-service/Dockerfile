FROM openjdk:17-jdk-slim
WORKDIR /app

# Copia solo el JAR ya compilado
COPY target/*.jar app.jar

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
