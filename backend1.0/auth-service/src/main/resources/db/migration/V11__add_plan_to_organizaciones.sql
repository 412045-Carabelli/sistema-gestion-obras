-- V11: Vincular organizaciones con plan y suscripción activa
ALTER TABLE organizaciones
    ADD plan_id                 BIGINT REFERENCES planes(id),
        suscripcion_activa_id   BIGINT;   -- FK circular → no REFERENCES, se gestiona por app

-- Por defecto todas las orgs existentes arrancan en FREE
UPDATE organizaciones
SET plan_id = (SELECT id FROM planes WHERE codigo = 'FREE');

-- Índice para joins frecuentes
CREATE INDEX idx_organizaciones_plan_id ON organizaciones(plan_id);
