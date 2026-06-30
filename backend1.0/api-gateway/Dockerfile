# ---- Etapa 1: Build ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY backend1.0/ .
RUN mvn clean package -pl api-gateway -am -DskipTests -Dmaven.test.skip=true

# ---- Etapa 2: Runtime ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
