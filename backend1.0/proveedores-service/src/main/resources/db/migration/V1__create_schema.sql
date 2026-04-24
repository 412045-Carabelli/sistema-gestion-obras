CREATE TABLE tipo_proveedor (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL UNIQUE,
    activo               BIT          NOT NULL DEFAULT 1,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE gremios (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL,
    activo               BIT          NOT NULL DEFAULT 1,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE proveedores (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL,
    tipo_proveedor_id    BIGINT,
    gremio_id            BIGINT,
    dni_cuit             VARCHAR(20),
    contacto             VARCHAR(255),
    telefono             VARCHAR(255),
    email                VARCHAR(255),
    direccion            VARCHAR(255),
    activo               BIT          DEFAULT 1,
    creado_en            DATETIME2,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255),
    CONSTRAINT fk_prov_tipo   FOREIGN KEY (tipo_proveedor_id) REFERENCES tipo_proveedor(id),
    CONSTRAINT fk_prov_gremio FOREIGN KEY (gremio_id)         REFERENCES gremios(id)
);

CREATE TABLE movimientos (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    proveedor_id  BIGINT        NOT NULL,
    obra_id       BIGINT,
    descripcion   VARCHAR(255),
    monto         DECIMAL(14,2) NOT NULL DEFAULT 0,
    monto_pagado  DECIMAL(14,2) NOT NULL DEFAULT 0,
    pagado        BIT           NOT NULL DEFAULT 0,
    creado_en     DATETIME2,
    CONSTRAINT fk_mov_prov FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);
