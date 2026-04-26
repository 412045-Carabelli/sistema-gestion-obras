CREATE TABLE clientes (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL,
    id_empresa           BIGINT,
    contacto             VARCHAR(255),
    cuit                 VARCHAR(255),
    telefono             VARCHAR(255),
    email                VARCHAR(255),
    direccion            VARCHAR(255),
    condicion_iva        VARCHAR(50)  NOT NULL DEFAULT 'RESPONSABLE_INSCRIPTO',
    activo               BIT          NOT NULL DEFAULT 1,
    creado_en            DATETIME2,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);
