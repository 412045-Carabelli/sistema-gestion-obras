# Clientes Service

Microservicio encargado del registro de clientes asociados a las obras. Integra auditoría automática y documentación OpenAPI.

## Endpoints principales

- `GET /api/v1/clientes`
- `POST /api/v1/clientes`
- `PUT /api/v1/clientes/{id}`
- `DELETE /api/v1/clientes/{id}`

## Swagger UI

Disponible en `http://localhost:8081/swagger-ui` (ajustar puerto según `application.properties`).

## Ejecución

```bash
mvn -pl clientes-service spring-boot:run
```
