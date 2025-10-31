# Transacciones Service

Microservicio responsable de registrar las transacciones económicas asociadas a las obras. Utiliza auditoría automática para registrar cambios en cada transacción.

## Endpoints principales

- `GET /api/v1/transacciones`
- `POST /api/v1/transacciones`
- `PUT /api/v1/transacciones/{id}`
- `DELETE /api/v1/transacciones/{id}`

## Swagger UI

Disponible en `http://localhost:8085/swagger-ui`.

## Ejecución

```bash
mvn -pl transacciones-service spring-boot:run
```
