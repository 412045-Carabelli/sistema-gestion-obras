FROM sistema-gestion-obras-obras-service:latest

WORKDIR /app

RUN rm -f app.jar

COPY target/agendas-service-1.0.0.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
