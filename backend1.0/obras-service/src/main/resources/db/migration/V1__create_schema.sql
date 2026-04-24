CREATE TABLE estado_obra (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL UNIQUE,
    activo               BIT          DEFAULT 1,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE estado_pago (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    estado               VARCHAR(255) NOT NULL UNIQUE,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE estado_tarea (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre               VARCHAR(255) NOT NULL UNIQUE,
    activo               BIT          DEFAULT 1,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255)
);

CREATE TABLE obras (
    id                          BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_cliente                  BIGINT        NOT NULL,
    estado_obra                 VARCHAR(50)   NOT NULL,
    nombre                      VARCHAR(120)  NOT NULL,
    direccion                   VARCHAR(255),
    fecha_presupuesto           DATETIME2,
    fecha_inicio                DATETIME2,
    fecha_fin                   DATETIME2,
    fecha_adjudicada            DATETIME2,
    fecha_perdida               DATETIME2,
    presupuesto                 DECIMAL(14,2),
    beneficio_global            BIT,
    tiene_comision              BIT,
    beneficio                   DECIMAL(14,2),
    comision                    DECIMAL(14,2),
    activo                      BIT           DEFAULT 1,
    creado_en                   DATETIME2,
    notas                       NVARCHAR(MAX),
    memoria_descriptiva         NVARCHAR(MAX),
    condiciones_presupuesto     NVARCHAR(MAX),
    observaciones_presupuesto   NVARCHAR(MAX),
    requiere_factura            BIT,
    ultima_actualizacion        DATETIME2,
    tipo_actualizacion          VARCHAR(255)
);

CREATE TABLE tareas (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_obra              BIGINT        NOT NULL,
    id_proveedor         BIGINT        NOT NULL,
    numero_orden         INT,
    estado_tarea         VARCHAR(50)   NOT NULL,
    nombre               VARCHAR(150)  NOT NULL,
    descripcion          NVARCHAR(MAX),
    porcentaje           FLOAT         NOT NULL DEFAULT 0,
    fecha_inicio         DATETIME2,
    fecha_fin            DATETIME2,
    creado_en            DATETIME2     NOT NULL,
    activo               BIT           DEFAULT 1,
    baja_obra            BIT           DEFAULT 0,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255),
    CONSTRAINT fk_tarea_obra FOREIGN KEY (id_obra) REFERENCES obras(id)
);

CREATE TABLE obra_costo (
    id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_proveedor         BIGINT,
    precio_unitario      DECIMAL(14,2) NOT NULL,
    id_estado_pago       VARCHAR(50),
    id_obra              BIGINT        NOT NULL,
    tipo_costo           VARCHAR(50)   NOT NULL DEFAULT 'ORIGINAL',
    item_numero          VARCHAR(255),
    descripcion          NVARCHAR(MAX) NOT NULL,
    unidad               VARCHAR(255)  NOT NULL,
    cantidad             DECIMAL(14,3) NOT NULL,
    beneficio            DECIMAL(14,2),
    subtotal             DECIMAL(14,2) NOT NULL,
    total                DECIMAL(14,2) NOT NULL,
    activo               BIT           DEFAULT 1,
    baja_obra            BIT           DEFAULT 0,
    ultima_actualizacion DATETIME2,
    tipo_actualizacion   VARCHAR(255),
    CONSTRAINT fk_costo_obra FOREIGN KEY (id_obra) REFERENCES obras(id)
);

CREATE TABLE obra_proveedor (
    id_obra      BIGINT NOT NULL,
    id_proveedor BIGINT NOT NULL,
    CONSTRAINT pk_obra_proveedor PRIMARY KEY (id_obra, id_proveedor),
    CONSTRAINT fk_op_obra FOREIGN KEY (id_obra) REFERENCES obras(id)
);
