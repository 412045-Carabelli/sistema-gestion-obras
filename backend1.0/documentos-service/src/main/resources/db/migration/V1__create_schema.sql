CREATE TABLE tipos_documento (
    id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE documentos (
    id_documento      BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_obra           BIGINT        NOT NULL,
    id_asociado       BIGINT,
    tipo_asociado     VARCHAR(255),
    nombre_archivo    VARCHAR(255)  NOT NULL,
    path_archivo      VARCHAR(255)  NOT NULL,
    fecha             DATE          NOT NULL,
    observacion       VARCHAR(255),
    creado_en         DATETIME2,
    id_tipo_documento VARCHAR(50)   NOT NULL
);
