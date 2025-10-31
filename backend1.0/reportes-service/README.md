# Reportes Service

Servicio dedicado a consolidar información y exponer reportes agregados. Consume datos del resto de microservicios y conserva auditoría en los reportes generados.

## Endpoints principales

- `GET /api/v1/reportes`
- `GET /api/v1/reportes/{id}`

## Swagger UI

Disponible en `http://localhost:8086/swagger-ui`.

## Ejecución

```bash
mvn -pl reportes-service spring-boot:run
```
