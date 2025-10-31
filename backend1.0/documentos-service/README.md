# Documentos Service

Servicio reactivo que gestiona documentos vinculados a las obras. Opera con auditoría automática gracias al módulo común.

## Endpoints destacados

- `GET /api/v1/documentos`
- `POST /api/v1/documentos`
- `PUT /api/v1/documentos/{id}`
- `DELETE /api/v1/documentos/{id}`

## Swagger UI

Disponible en `http://localhost:8084/swagger-ui`.

## Ejecución

```bash
mvn -pl documentos-service spring-boot:run
```
