CREATE TABLE comisiones (
    id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_obra BIGINT        NOT NULL,
    monto   DECIMAL(15,2),
    fecha   DATE,
    pagado  BIT           DEFAULT 0
);

CREATE TABLE movimientos_reporte (
    id         BIGINT IDENTITY(1,1) PRIMARY KEY,
    referencia VARCHAR(255),
    monto      DECIMAL(15,2),
    fecha      DATE,
    tipo       VARCHAR(100)
);
