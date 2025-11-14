FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copia solo el JAR ya compilado
COPY target/*.jar app.jar
RUN mkdir -p data

EXPOSE 8087
ENTRYPOINT ["java", "-jar", "app.jar"]
