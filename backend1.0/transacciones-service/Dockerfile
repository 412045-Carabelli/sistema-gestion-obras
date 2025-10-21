FROM openjdk:17-jdk-slim
WORKDIR /app

# Copia solo el JAR ya compilado
COPY target/*.jar app.jar
COPY data ./data

EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
