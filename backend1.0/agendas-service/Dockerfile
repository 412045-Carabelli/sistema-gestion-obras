FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN mkdir -p data

COPY target/agendas-service-1.14.25.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
