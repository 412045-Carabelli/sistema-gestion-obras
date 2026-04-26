CREATE TABLE tipo_transaccion (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL,
    activo               BIT          DEFAULT 1,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE transacciones (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_obra             BIGINT        NOT NULL,
    tipo_asociado       VARCHAR(255)  NOT NULL,
    id_asociado         BIGINT        NOT NULL,
    id_tipo_transaccion VARCHAR(50)   NOT NULL,
    fecha               DATE,
    monto               FLOAT         NOT NULL,
    forma_pago          VARCHAR(255)  NOT NULL,
    medio_pago          VARCHAR(255),
    concepto            NVARCHAR(MAX),
    factura_cobrada     BIT,
    activo              BIT           DEFAULT 1,
    baja_obra           BIT           DEFAULT 0,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion  VARCHAR(255)
);

CREATE TABLE facturas (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_cliente           BIGINT        NOT NULL,
    id_obra              BIGINT,
    monto                DECIMAL(14,2) NOT NULL,
    monto_restante       DECIMAL(14,2) NOT NULL,
    fecha                DATE,
    descripcion          NVARCHAR(MAX),
    estado               VARCHAR(255)  DEFAULT 'EMITIDA',
    nombre_archivo       VARCHAR(255),
    path_archivo         VARCHAR(255),
    activo               BIT           DEFAULT 1,
    impacta_cta_cte      BIT           DEFAULT 0,
    id_transaccion       BIGINT,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);
