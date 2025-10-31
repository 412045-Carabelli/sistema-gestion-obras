# API Gateway

Gateway reactivo basado en Spring Cloud Gateway que enruta el tráfico a los microservicios internos y aplica mecanismos de resiliencia con Resilience4j.

## Características

- Circuit breaking y reintentos configurables.
- Documentación OpenAPI disponible en `http://localhost:8088/swagger-ui` (puerto según configuración en `application.yml`).
- Integración sencilla con los servicios de usuarios, empresas y JWT.

## Ejecución

```bash
mvn -pl api-gateway spring-boot:run
```
