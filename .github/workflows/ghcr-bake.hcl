group "default" {
  targets = [
    "obras-service",
    "clientes-service",
    "proveedores-service",
    "documentos-service",
    "transacciones-service",
    "agendas-service",
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
  context  = "backend1.0/obras-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-obras-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-obras-service:latest"
  ]
}

target "clientes-service" {
  inherits = ["_common"]
  context  = "backend1.0/clientes-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-clientes-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-clientes-service:latest"
  ]
}

target "proveedores-service" {
  inherits = ["_common"]
  context  = "backend1.0/proveedores-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-proveedores-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-proveedores-service:latest"
  ]
}

target "documentos-service" {
  inherits = ["_common"]
  context  = "backend1.0/documentos-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-documentos-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-documentos-service:latest"
  ]
}

target "transacciones-service" {
  inherits = ["_common"]
  context  = "backend1.0/transacciones-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-transacciones-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-transacciones-service:latest"
  ]
}

target "agendas-service" {
  inherits = ["_common"]
  context  = "backend1.0/agendas-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-agendas-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-agendas-service:latest"
  ]
}

target "reportes-service" {
  inherits = ["_common"]
  context  = "backend1.0/reportes-service"
  tags     = [
    "${REGISTRY}/${OWNER}/sgo-reportes-service:${TAG}",
    "${REGISTRY}/${OWNER}/sgo-reportes-service:latest"
  ]
}

target "api-gateway" {
  inherits = ["_common"]
  context  = "backend1.0/api-gateway"
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

