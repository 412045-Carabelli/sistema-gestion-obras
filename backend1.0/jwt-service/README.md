# JWT Service

Microservicio liviano para emitir tokens JWT firmados con un secreto compartido. Sirve como punto central de autenticación y puede eliminarse sin afectar el resto del ecosistema.

## Endpoint principal

- `POST /api/v1/tokens` – Genera un token en base al `subject` y roles opcionales.

### Ejemplo de request

```json
{
  "subject": "usuario@test.com",
  "roles": ["ADMIN", "USER"]
}
```

## Swagger UI

Disponible en `http://localhost:8090/swagger-ui`.

## Configuración rápida

- Puerto: `8090`.
- Secreto configurable mediante `security.jwt.secret`.

## Ejecución

```bash
mvn -pl jwt-service spring-boot:run
```
