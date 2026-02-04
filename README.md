SGO - Sistema de Gestión de Obras

Arranque de microservicios en local (dev) y con imágenes GHCR (prod-like).

Uso rápido

- Local (dev, build desde código):
  - Requisitos: Docker y Docker Compose, JDK/Maven solo si compilas fuera de Docker.
  - Comando: `docker compose -f docker-compose.dev.yml up -d`
  - Servicios expuestos:
    - API Gateway: `http://localhost:8080`
    - Frontend: `http://localhost:4200`

- GHCR (prod-like, usa imágenes pre-construidas):
  - Copia `.env.example` a `.env` y ajusta `GHCR_OWNER` y `TAG`.
  - Comando: `docker compose -f docker-compose.ghcr.yml --env-file .env up -d`
  - Datos: usa volúmenes nombrados (aislados del entorno dev). Limpia datos con `docker compose -f docker-compose.ghcr.yml --env-file .env down -v` o `./tools/clean-ghcr-data.ps1`.
  - Frontend: mientras no esté en GHCR, se construye localmente y expone `http://localhost:4200`.

Notas

- El frontend apunta al API Gateway en `http://localhost:8080` (ver `frontend1.2/src/environments`).
- Cuando publiques `sgo-frontend` en GHCR, cambia el servicio `frontend` en `docker-compose.ghcr.yml` a usar la imagen: `${REGISTRY}/${GHCR_OWNER}/sgo-frontend:${TAG}`.
- Documentos: el almacenamiento ahora soporta MinIO. En `docker-compose.yml` y `backend1.0/docker-compose.backend.yml` ya estÃ¡ incluido el servicio `minio` con el bucket `documentos`.
