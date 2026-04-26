group "default" {
  targets = [
    "obras-service",
    "clientes-service",
    "proveedores-service",
    "documentos-service",
    "transacciones-service",
    "reportes-service",
    "api-gateway",
    "frontend",
    "migrador"
  ]
}

variable "REGISTRY" {
  default = "ghcr.io"
}
variable "OWNER" {
  default = "local"
}
variable "TAG" {
  default = "latest"
}

target "_common" {
  args = {
    REGISTRY = "${REGISTRY}"
    OWNER    = "${OWNER}"
    TAG      = "${TAG}"
  }
  push = true
}

target "obras-service" {
  inherits = ["_common"]
  context  = "backend/obras-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-obras-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-obras-service:latest"
  ]
}

target "clientes-service" {
  inherits = ["_common"]
  context  = "backend/clientes-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-clientes-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-clientes-service:latest"
  ]
}

target "proveedores-service" {
  inherits = ["_common"]
  context  = "backend/proveedores-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-proveedores-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-proveedores-service:latest"
  ]
}

target "documentos-service" {
  inherits = ["_common"]
  context  = "backend/documentos-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-documentos-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-documentos-service:latest"
  ]
}

target "transacciones-service" {
  inherits = ["_common"]
  context  = "backend/transacciones-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-transacciones-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-transacciones-service:latest"
  ]
}

target "reportes-service" {
  inherits = ["_common"]
  context  = "backend/reportes-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-reportes-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-reportes-service:latest"
  ]
}

target "api-gateway" {
  inherits = ["_common"]
  context  = "backend/api-gateway"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-api-gateway:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-api-gateway:latest"
  ]
}

target "frontend" {
  inherits = ["_common"]
  context  = "frontend"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-frontend:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-frontend:latest"
  ]
}

target "migrador" {
  inherits = ["_common"]
  context  = "db/migrador"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-migrador:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-migrador:latest"
  ]
}

