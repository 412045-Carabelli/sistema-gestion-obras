-- V11: Vincular organizaciones con plan y suscripción activa
-- GO separa batches para que SQL Server re-parsee después del ALTER TABLE ADD

ALTER TABLE organizaciones
    ADD plan_id               BIGINT NULL,
        suscripcion_activa_id BIGINT NULL;
GO

ALTER TABLE organizaciones
    ADD CONSTRAINT fk_organizaciones_plan
    FOREIGN KEY (plan_id) REFERENCES planes(id);
GO

UPDATE organizaciones
SET plan_id = (SELECT id FROM planes WHERE codigo = 'FREE');
GO

CREATE INDEX idx_organizaciones_plan_id ON organizaciones(plan_id);
GO
