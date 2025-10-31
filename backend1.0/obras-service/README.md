# Obras Service

Microservicio que administra las obras, tareas, proveedores asociados y estados operativos. Aprovecha la auditoría centralizada para registrar cambios en obras y costos.

## Endpoints principales

- `GET /api/v1/obras`
- `GET /api/v1/obras/{id}`
- `POST /api/v1/obras`
- `PUT /api/v1/obras/{id}`
- `GET /api/v1/obras/{id}/progresos`

## Swagger UI

Disponible en `http://localhost:8083/swagger-ui` (ver configuración).

## Ejecución

```bash
mvn -pl obras-service spring-boot:run
```
