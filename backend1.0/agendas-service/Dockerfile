FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN mkdir -p data

COPY target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
