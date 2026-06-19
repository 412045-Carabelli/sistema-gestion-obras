-- Recrear sp_saldos_proveedores con filtro de organizacion
CREATE OR ALTER PROCEDURE sp_saldos_proveedores
    @organizacion_id BIGINT
AS
BEGIN
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
        obra_costo oc
        ON p.id = oc.id_proveedor
        AND oc.activo = 1
    LEFT JOIN
        obras o
        ON oc.id_obra = o.id
        AND o.activo = 1
        AND o.organizacion_id = @organizacion_id
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'PROVEEDOR'
        AND t.id_asociado = p.id
        AND t.activo = 1
    WHERE
        p.activo = 1
        AND p.organizacion_id = @organizacion_id
    GROUP BY
        p.id,
        p.nombre
    ORDER BY
        p.nombre ASC;
END;
GO

-- Recrear sp_saldos_clientes con filtro de organizacion
CREATE OR ALTER PROCEDURE sp_saldos_clientes
    @organizacion_id BIGINT
AS
BEGIN
    SELECT
        c.id,
        c.nombre,
        ISNULL(SUM(CASE
            WHEN o.estado_obra NOT IN ('CANCELADA', 'RECHAZADA')
            THEN o.presupuesto
            ELSE 0
        END), 0) AS total_presupuesto,
        ISNULL(SUM(CASE
            WHEN t.id_tipo_transaccion IN (
                SELECT id FROM [sgo_transacciones].[dbo].[tipo_transaccion] WHERE nombre = 'COBRO' AND activo = 1
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
                SELECT id FROM [sgo_transacciones].[dbo].[tipo_transaccion] WHERE nombre = 'COBRO' AND activo = 1
            )
            THEN t.monto
            ELSE 0
        END), 0) AS saldo_pendiente
    FROM
        [sgo_clientes].[dbo].[clientes] c
    LEFT JOIN
        obras o
        ON c.id = o.id_cliente
        AND o.activo = 1
        AND o.organizacion_id = @organizacion_id
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'CLIENTE'
        AND t.id_asociado = c.id
        AND t.activo = 1
    WHERE
        c.activo = 1
        AND c.organizacion_id = @organizacion_id
    GROUP BY
        c.id,
        c.nombre
    ORDER BY
        c.nombre ASC;
END;
GO

-- Recrear sp_saldos_grupos_clientes con filtro de organizacion
CREATE OR ALTER PROCEDURE sp_saldos_grupos_clientes
    @organizacion_id BIGINT
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
        AND g.organizacion_id = @organizacion_id
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

-- Recrear sp_saldos_grupos_proveedores con filtro de organizacion
CREATE OR ALTER PROCEDURE sp_saldos_grupos_proveedores
    @organizacion_id BIGINT
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
        AND g.organizacion_id = @organizacion_id
    GROUP BY
        g.id,
        g.nombre,
        p.id,
        p.nombre
    ORDER BY
        g.nombre ASC,
        p.nombre ASC;
END;
GO
