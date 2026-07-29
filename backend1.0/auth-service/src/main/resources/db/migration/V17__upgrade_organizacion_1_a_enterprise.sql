-- V17: Asignar plan ENTERPRISE (sin limites) a la organizacion de Pablo (Meliquina, id 1)
-- Idempotente: la base de dev es compartida entre ramas.

UPDATE organizaciones
SET plan_id = (SELECT id FROM planes WHERE codigo = 'ENTERPRISE')
WHERE id = 1;
GO

IF NOT EXISTS (
    SELECT 1 FROM suscripciones
    WHERE organizacion_id = 1 AND estado = 'ACTIVA'
)
BEGIN
    INSERT INTO suscripciones (
        organizacion_id, plan_id, estado, ciclo,
        precio_base_usd, descuento_aplicado_usd, precio_final_usd,
        fecha_inicio, fecha_vencimiento
    )
    SELECT
        1, id, 'ACTIVA', 'MENSUAL',
        precio_mensual_usd, precio_mensual_usd, 0,
        GETDATE(), '2099-12-31'
    FROM planes WHERE codigo = 'ENTERPRISE';
END
GO
