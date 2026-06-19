-- V3__create_view_costos_con_monto_real.sql
-- Vista que prioriza monto_real para reportes (gasto real vs cotizado)

CREATE VIEW v_costos_monto_base AS
SELECT
    oc.id,
    oc.id_obra,
    oc.id_proveedor,
    oc.descripcion,
    oc.cantidad,
    oc.precio_unitario,
    oc.subtotal,
    oc.total,
    oc.monto_real,
    -- Priorizar monto_real si existe, si no usar subtotal
    CASE
        WHEN oc.monto_real IS NOT NULL AND oc.monto_real > 0 THEN oc.monto_real
        ELSE oc.subtotal
    END AS monto_base,
    oc.id_estado_pago,
    oc.activo
FROM obra_costo oc
WHERE oc.activo = 1;
