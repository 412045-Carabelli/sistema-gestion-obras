# ---- Etapa 1: Build ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY backend1.0/ .
RUN mvn clean package -pl auth-service -am -DskipTests -Dmaven.test.skip=true

# ---- Etapa 2: Runtime ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/auth-service/target/*.jar app.jar
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar"]
