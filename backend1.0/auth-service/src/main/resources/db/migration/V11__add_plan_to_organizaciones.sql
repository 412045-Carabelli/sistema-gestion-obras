-- V11: Vincular organizaciones con plan y suscripción activa
ALTER TABLE organizaciones
    ADD plan_id               BIGINT NULL,
        suscripcion_activa_id BIGINT NULL;

ALTER TABLE organizaciones
    ADD CONSTRAINT fk_organizaciones_plan
    FOREIGN KEY (plan_id) REFERENCES planes(id);

-- Por defecto todas las orgs existentes arrancan en FREE
UPDATE organizaciones
SET plan_id = (SELECT id FROM planes WHERE codigo = 'FREE');

-- Índice para joins frecuentes
CREATE INDEX idx_organizaciones_plan_id ON organizaciones(plan_id);
