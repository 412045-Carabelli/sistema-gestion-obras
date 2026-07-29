-- Cada plan de pago en Buildrr tiene dos preapproval_plan en MP:
-- uno para ciclo MENSUAL y otro para ANUAL.
-- Se registran aquí una sola vez y se referencian al crear cada suscripción.

ALTER TABLE planes ADD mp_preapproval_plan_id_mensual NVARCHAR(255) NULL;
ALTER TABLE planes ADD mp_preapproval_plan_id_anual   NVARCHAR(255) NULL;
