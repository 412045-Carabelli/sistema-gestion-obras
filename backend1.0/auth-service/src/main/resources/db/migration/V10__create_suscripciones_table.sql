-- V10: Tabla de suscripciones (historial + activa por org)
CREATE TABLE suscripciones (
    id                      BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    organizacion_id         BIGINT NOT NULL,
    plan_id                 BIGINT NOT NULL REFERENCES planes(id),
    descuento_id            BIGINT         REFERENCES descuentos(id),

    -- Estado
    estado                  NVARCHAR(20)  NOT NULL DEFAULT 'TRIAL',
    -- TRIAL | ACTIVA | VENCIDA | CANCELADA | SUSPENDIDA

    -- Ciclo de facturación
    ciclo                   NVARCHAR(10)  NOT NULL DEFAULT 'MENSUAL',
    -- MENSUAL | ANUAL

    -- Precios al momento de contratar (snapshot — si el plan cambia, esto no cambia)
    precio_base_usd         DECIMAL(10,2) NOT NULL,
    descuento_aplicado_usd  DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_final_usd        DECIMAL(10,2) NOT NULL,

    -- Vigencia
    fecha_inicio            DATETIME2     NOT NULL DEFAULT GETDATE(),
    fecha_vencimiento       DATETIME2     NOT NULL,
    fecha_cancelacion       DATETIME2,

    -- Mercado Pago (se completa en Fase 5)
    mp_preapproval_id       NVARCHAR(255),   -- ID suscripción recurrente MP
    mp_payment_id           NVARCHAR(255),   -- último pago procesado
    mp_status               NVARCHAR(50),    -- authorized | paused | cancelled

    -- Motivo de cancelación
    motivo_cancelacion      NVARCHAR(500),

    creado_en               DATETIME2 NOT NULL DEFAULT GETDATE(),
    ultima_actualizacion    DATETIME2
);

CREATE INDEX idx_suscripciones_org_id  ON suscripciones(organizacion_id);
CREATE INDEX idx_suscripciones_estado  ON suscripciones(estado);
CREATE INDEX idx_suscripciones_plan_id ON suscripciones(plan_id);
CREATE INDEX idx_suscripciones_vto     ON suscripciones(fecha_vencimiento);
