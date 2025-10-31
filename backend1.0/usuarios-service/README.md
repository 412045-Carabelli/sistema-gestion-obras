# Usuarios Service

Microservicio responsable de administrar el catálogo de usuarios maestros. Expone operaciones CRUD con auditoría automática y documentación OpenAPI.

## Endpoints principales

- `GET /api/v1/usuarios` – Lista usuarios.
- `GET /api/v1/usuarios/{id}` – Obtiene un usuario específico.
- `POST /api/v1/usuarios` – Crea un usuario.
- `PUT /api/v1/usuarios/{id}` – Actualiza un usuario.
- `DELETE /api/v1/usuarios/{id}` – Elimina un usuario.

## Swagger UI

La documentación interactiva está disponible en `http://localhost:8070/swagger-ui`.

## Configuración rápida

- Base de datos: SQLite embebido (`usuarios.db`).
- Puerto: `8070`.

## Ejecución

```bash
mvn -pl usuarios-service spring-boot:run
```
