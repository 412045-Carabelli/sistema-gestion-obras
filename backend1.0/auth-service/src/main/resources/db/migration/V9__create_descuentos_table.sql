-- V9: Tabla de descuentos / cupones
CREATE TABLE descuentos (
    id                  BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    codigo              NVARCHAR(50)   NOT NULL UNIQUE,   -- ej: PROMO2025, LAUNCH50
    descripcion         NVARCHAR(255),

    -- Tipo y valor del descuento
    tipo                NVARCHAR(20)   NOT NULL,          -- PORCENTAJE | MONTO_FIJO
    valor               DECIMAL(10,2)  NOT NULL,          -- 20.00 = 20% o $20 flat

    -- Restricción de plan (NULL = aplica a todos)
    plan_id             BIGINT         REFERENCES planes(id),

    -- Restricción de ciclo (NULL = ambos)
    aplica_ciclo        NVARCHAR(10),                     -- MENSUAL | ANUAL | NULL

    -- Vigencia
    valido_desde        DATETIME2      NOT NULL DEFAULT GETDATE(),
    valido_hasta        DATETIME2,                        -- NULL = sin vencimiento

    -- Cupos
    max_usos            INT,                              -- NULL = usos ilimitados
    usos_actuales       INT NOT NULL DEFAULT 0,

    -- Restricción de primer uso solamente
    solo_primer_pago    BIT NOT NULL DEFAULT 0,

    activo              BIT NOT NULL DEFAULT 1,
    creado_en           DATETIME2 NOT NULL DEFAULT GETDATE(),
    creado_por          NVARCHAR(100),
    ultima_actualizacion DATETIME2
);

CREATE INDEX idx_descuentos_codigo  ON descuentos(codigo);
CREATE INDEX idx_descuentos_activo  ON descuentos(activo);
CREATE INDEX idx_descuentos_plan_id ON descuentos(plan_id);
