-- SP para saldos agrupados por grupos_obras (lado CLIENTES)
-- Devuelve: id_grupo, nombre_grupo, id_cliente, nombre_cliente, total_presupuesto, total_cobros, saldo_pendiente

CREATE PROCEDURE sp_saldos_grupos_clientes
AS
BEGIN
    SELECT
        g.id AS id_grupo,
        g.nombre AS nombre_grupo,
        c.id AS id_cliente,
        c.nombre AS nombre_cliente,
        ISNULL(SUM(CASE
            WHEN o.estado_obra NOT IN ('CANCELADA', 'RECHAZADA')
            THEN o.presupuesto
            ELSE 0
        END), 0) AS total_presupuesto,
        ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'COBRO' AND activo = 1
            )
            THEN t.monto
            ELSE 0
        END), 0) AS total_cobros,
        ISNULL(SUM(CASE
            WHEN o.estado_obra NOT IN ('CANCELADA', 'RECHAZADA')
            THEN o.presupuesto
            ELSE 0
        END), 0)
        - ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'COBRO' AND activo = 1
            )
            THEN t.monto
            ELSE 0
        END), 0) AS saldo_pendiente
    FROM
        grupos_obras g
    INNER JOIN
        clientes c
        ON g.id_cliente = c.id
        AND c.activo = 1
    LEFT JOIN
        obras o
        ON g.id = o.id_grupo
        AND o.id_cliente = c.id
        AND o.activo = 1
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'CLIENTE'
        AND t.id_asociado = c.id
        AND t.activo = 1
    WHERE
        g.activo = 1
    GROUP BY
        g.id,
        g.nombre,
        c.id,
        c.nombre
    ORDER BY
        g.nombre ASC,
        c.nombre ASC;
END;

GO

-- SP para saldos agrupados por grupos_obras (lado PROVEEDORES)
-- Devuelve: id_grupo, nombre_grupo, id_proveedor, nombre_proveedor, total_costos, total_pagos, saldo_pendiente

CREATE PROCEDURE sp_saldos_grupos_proveedores
AS
BEGIN
    SELECT
        g.id AS id_grupo,
        g.nombre AS nombre_grupo,
        p.id AS id_proveedor,
        p.nombre AS nombre_proveedor,
        ISNULL(SUM(CASE
            WHEN oc.activo = 1
            THEN oc.subtotal
            ELSE 0
        END), 0) AS total_costos,
        ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1
            )
            AND t.activo = 1
            THEN t.monto
            ELSE 0
        END), 0) AS total_pagos,
        ISNULL(SUM(CASE
            WHEN oc.activo = 1
            THEN oc.subtotal
            ELSE 0
        END), 0)
        - ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1
            )
            AND t.activo = 1
            THEN t.monto
            ELSE 0
        END), 0) AS saldo_pendiente
    FROM
        grupos_obras g
    INNER JOIN
        obras o
        ON g.id = o.id_grupo
        AND o.activo = 1
    INNER JOIN
        obra_costo oc
        ON o.id = oc.id_obra
        AND oc.activo = 1
    INNER JOIN
        proveedores p
        ON oc.id_proveedor = p.id
        AND p.activo = 1
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'PROVEEDOR'
        AND t.id_asociado = p.id
        AND t.activo = 1
    WHERE
        g.activo = 1
    GROUP BY
        g.id,
        g.nombre,
        p.id,
        p.nombre
    ORDER BY
        g.nombre ASC,
        p.nombre ASC;
END;
