FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copia solo el JAR ya compilado
COPY target/*.jar app.jar
COPY data ./data

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
