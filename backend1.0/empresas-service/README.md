# Empresas Service

Microservicio que administra las empresas vinculadas a los usuarios y el catálogo de obras. Permite crear, actualizar y eliminar empresas manteniendo la auditoría automática.

## Endpoints principales

- `GET /api/v1/empresas` – Lista empresas, permite filtrar por `usuarioId`.
- `GET /api/v1/empresas/{id}` – Detalle de una empresa.
- `POST /api/v1/empresas` – Crea una empresa.
- `PUT /api/v1/empresas/{id}` – Actualiza una empresa.
- `DELETE /api/v1/empresas/{id}` – Elimina una empresa.

## Swagger UI

Disponible en `http://localhost:8080/swagger-ui`.

## Configuración rápida

- Base de datos: SQLite embebido (`empresas.db`).
- Puerto: `8080`.

## Ejecución

```bash
mvn -pl empresas-service spring-boot:run
```
