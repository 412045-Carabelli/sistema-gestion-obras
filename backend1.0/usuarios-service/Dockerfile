FROM openjdk:17-jdk-slim
WORKDIR /app

COPY target/*.jar app.jar
COPY data ./data

EXPOSE 8070

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=render"]
