-- Paso 1: Calcular estado_financiero desde facturas reales (cross-db)
-- Respeta requiere_factura: si false → solo COBRADA/COBRADA_PARCIAL
UPDATE o
SET o.estado_financiero =
    CASE
        -- Obras que requieren factura
        WHEN o.requiere_factura = 1 AND f.total_cobrado >= o.presupuesto - 0.01   THEN 'COBRADA'
        WHEN o.requiere_factura = 1 AND f.total_facturado >= o.presupuesto - 0.01  THEN 'FACTURADA'
        WHEN o.requiere_factura = 1 AND f.total_facturado > 0.01                   THEN 'FACTURADA_PARCIAL'
        -- Obras que NO requieren factura
        WHEN o.requiere_factura = 0 AND f.total_cobrado >= o.presupuesto - 0.01   THEN 'COBRADA'
        WHEN o.requiere_factura = 0 AND f.total_cobrado > 0.01                     THEN 'COBRADA_PARCIAL'
        WHEN o.requiere_factura = 0 AND f.total_facturado > 0.01                   THEN 'COBRADA_PARCIAL'
        ELSE NULL
    END
FROM sgo_obras.dbo.obras o
INNER JOIN (
    SELECT
        id_obra,
        SUM(monto)                                                    AS total_facturado,
        SUM(CASE WHEN estado = 'COBRADA' THEN monto ELSE 0 END)       AS total_cobrado
    FROM sgo_transacciones.dbo.facturas
    WHERE activo = 1
      AND id_obra IS NOT NULL
    GROUP BY id_obra
) f ON o.id = f.id_obra
WHERE o.activo = 1;

-- Paso 2: Obras que tenian estado admin en obra_estado → resetear a ADJUDICADA
UPDATE sgo_obras.dbo.obras
SET estado_obra = 'ADJUDICADA'
WHERE estado_obra IN ('FACTURADA_PARCIAL', 'FACTURADA', 'COBRADA_PARCIAL', 'COBRADA')
  AND activo = 1;
