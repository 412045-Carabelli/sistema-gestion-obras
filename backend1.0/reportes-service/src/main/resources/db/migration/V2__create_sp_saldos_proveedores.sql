-- Vista para saldos de proveedores
CREATE OR ALTER VIEW vw_saldos_proveedores AS
SELECT
    p.id,
    p.nombre,
    ISNULL(SUM(oc.total), 0) AS total_costos,
    ISNULL(SUM(CASE
        WHEN t.id_tipo_transaccion IN (
            SELECT id FROM [sgo_transacciones].[dbo].[tipo_transaccion] WHERE nombre = 'PAGO' AND activo = 1
        )
        THEN t.monto
        ELSE 0
    END), 0) AS total_pagos,
    ISNULL(SUM(oc.total), 0)
    - ISNULL(SUM(CASE
        WHEN t.id_tipo_transaccion IN (
            SELECT id FROM [sgo_transacciones].[dbo].[tipo_transaccion] WHERE nombre = 'PAGO' AND activo = 1
        )
        THEN t.monto
        ELSE 0
    END), 0) AS saldo_pendiente
FROM
    [sgo_proveedores].[dbo].[proveedores] p
LEFT JOIN
    [sgo_obras].[dbo].[obra_costo] oc
    ON p.id = oc.id_proveedor
    AND oc.activo = 1
LEFT JOIN
    [sgo_obras].[dbo].[obras] o
    ON oc.id_obra = o.id
    AND o.activo = 1
LEFT JOIN
    [sgo_transacciones].[dbo].[transacciones] t
    ON o.id = t.id_obra
    AND t.tipo_asociado = 'PROVEEDOR'
    AND t.id_asociado = p.id
    AND t.activo = 1
WHERE
    p.activo = 1
GROUP BY
    p.id,
    p.nombre;
GO
