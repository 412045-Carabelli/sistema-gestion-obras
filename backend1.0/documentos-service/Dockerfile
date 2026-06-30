# ---- Etapa 1: Build ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY backend1.0/ .
RUN mvn clean package -pl documentos-service -am -DskipTests -Dmaven.test.skip=true

# ---- Etapa 2: Runtime ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN mkdir -p data
COPY --from=builder /build/documentos-service/target/*.jar app.jar
EXPOSE 8087
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
