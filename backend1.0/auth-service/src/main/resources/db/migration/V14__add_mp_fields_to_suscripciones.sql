-- Almacena el preapproval_plan_id de MP usado al crear la suscripción
-- (snapshot por si el plan cambia después)
ALTER TABLE suscripciones ADD mp_preapproval_plan_id NVARCHAR(255) NULL;

-- External reference devuelta por MP en la notificación (útil para idempotencia)
ALTER TABLE suscripciones ADD mp_external_reference  NVARCHAR(255) NULL;

-- URL del checkout de MP (init_point) — útil para reenviar al usuario si no pagó
ALTER TABLE suscripciones ADD mp_init_point NVARCHAR(1000) NULL;

CREATE INDEX idx_suscripciones_mp_preapproval ON suscripciones(mp_preapproval_id);
CREATE INDEX idx_suscripciones_mp_ext_ref    ON suscripciones(mp_external_reference);
