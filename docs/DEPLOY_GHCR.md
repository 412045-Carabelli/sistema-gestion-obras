# Despliegue con GHCR (GitHub Container Registry)

Este flujo permite publicar las imágenes Docker de todos los microservicios en `ghcr.io` y compartir con tu cliente un paquete mínimo (compose) que baja imágenes ya construidas, sin código fuente.

## 1) Pre-requisitos

- Docker instalado (con permisos para `docker build` y `docker push`).
- Cuenta en GitHub (usuario u organización) donde publicarás los paquetes.
- Token (PAT) con scope `write:packages` y opcionalmente `read:packages`. En organizaciones, puede requerir aprobación del admin.

## 2) Autenticación en GHCR

1. Crea un PAT: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generar token.
   - Scopes mínimos: `write:packages` (para publicar), `read:packages` (para probar pulls), y `delete:packages` solo si planeas borrar paquetes.
2. En tu terminal PowerShell:

```powershell
$env:GHCR_PAT = "ghp_xxx..."   # tu token
```

## 3) Construir y publicar imágenes

Opción A — Local: ejecuta el script de publicación indicando tu namespace (usuario u org) y un tag de versión:

```powershell
./tools/publish-ghcr.ps1 -Owner "tu-org-o-usuario" -Tag "1.0.0" -AlsoTagLatest
```

El script:
- Construye cada imagen con etiqueta local `sgo-<servicio>:<tag>`.
- Etiqueta y empuja a `ghcr.io/<Owner>/sgo-<servicio>:<tag>` y opcionalmente `:latest`.

Opción B — CI/CD (GitHub Actions): el workflow `Publish images to GHCR` compila los JARs y publica todas las imágenes solo cuando etiquetas (tags).

- Archivo: `.github/workflows/publish-ghcr.yml`
- Usa `GITHUB_TOKEN` con permisos `packages: write` (incluido en el workflow).
- Etiquetado: usa el nombre del tag (p. ej. `v1.2.3`).

Notas importantes:
- Los servicios Java esperan `target/*.jar`. Si no existen, compílalos antes (por ejemplo `mvn -q -DskipTests package`).
- Verifica luego en `https://github.com/<Owner>?tab=packages` que los paquetes se hayan creado.
- Si quieres que tu cliente pueda descargar sin autenticación, marca cada paquete como Público en la UI de GitHub (Package → Settings → Change visibility → Public).

## 4) Compose para despliegue (sin build)

Este repo incluye `docker-compose.ghcr.yml`, que referencia las imágenes pushed en GHCR y utiliza volúmenes nombrados (sin montar carpetas del proyecto).

1. Copia `.env.example` a `.env` y ajusta:

```env
GHCR_OWNER=tu-org-o-usuario
TAG=1.0.0
```

2. Levanta toda la pila usando las imágenes de GHCR:

```bash
docker compose -f docker-compose.ghcr.yml --env-file .env up -d
```

## 5) Entregar a tu cliente

Puedes comprimir y enviar solamente:
- `docker-compose.ghcr.yml`
- `.env` (con `GHCR_OWNER` y `TAG` apuntando a tu release)

Si las imágenes son públicas, tu cliente no necesita credenciales. Solo deberá tener Docker y ejecutar:

```bash
docker compose -f docker-compose.ghcr.yml --env-file .env up -d
```

## 6) Troubleshooting rápido

- `denied: installation not allowed` → Falta permiso en la organización o el paquete es privado. Haz público el paquete o comparte acceso.
- `manifest unknown` → El tag no existe en GHCR. Revisa `TAG` o vuelve a publicar.
- Errores al construir imágenes Java → El workflow ya compila los JARs (y el script sugiere compilar); si construyes local, asegura `target/*.jar` en cada servicio.

## 7) Datos iniciales (seed) por perfil

- En perfil `prod` (usado en Docker/compose), solo se cargan tablas auxiliares:
  - Obras: `estado_obra`, `estado_pago`, `estado_tarea`.
  - Proveedores: `tipo_proveedor`.
  - Documentos: `tipos_documento`.
  - Transacciones: `tipo_transaccion`.
  - Clientes: sin datos por defecto.

- En perfil `dev` se cargan además datos mock para pruebas. Los archivos fueron reubicados como `data-dev.sql` (mock) y `data-prod.sql` (auxiliares) según el microservicio; Spring Boot carga automáticamente `data-<profile>.sql`.
