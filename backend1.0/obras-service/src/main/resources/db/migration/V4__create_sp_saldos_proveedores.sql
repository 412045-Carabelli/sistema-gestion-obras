-- SP para calcular saldos de proveedores en bulk (1 query en lugar de N+1)
-- Devuelve: id, nombre, total_costos, total_pagos, saldo_pendiente
-- Optimizado: JOIN directo en la BD, sin loops en Java

CREATE PROCEDURE sp_saldos_proveedores
AS
BEGIN
    SELECT
        p.id,
        p.nombre,
        ISNULL(SUM(oc.total), 0) AS total_costos,
        ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1
            )
            THEN t.monto
            ELSE 0
        END), 0) AS total_pagos,
        ISNULL(SUM(oc.total), 0)
        - ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1
            )
            THEN t.monto
            ELSE 0
        END), 0) AS saldo_pendiente
    FROM
        proveedores p
    LEFT JOIN
        obra_costo oc
        ON p.id = oc.id_proveedor
        AND oc.activo = 1
    LEFT JOIN
        obras o
        ON oc.id_obra = o.id
        AND o.activo = 1
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'PROVEEDOR'
        AND t.id_asociado = p.id
        AND t.activo = 1
    WHERE
        p.activo = 1
    GROUP BY
        p.id,
        p.nombre
    ORDER BY
        p.nombre ASC;
END;
