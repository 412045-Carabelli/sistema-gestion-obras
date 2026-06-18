DROP PROCEDURE IF EXISTS sp_saldos_clientes;
GO

CREATE PROCEDURE sp_saldos_clientes
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
    LEFT JOIN
        transacciones t
        ON o.id = t.id_obra
        AND t.tipo_asociado = 'CLIENTE'
        AND t.id_asociado = c.id
        AND t.activo = 1
    WHERE
        c.activo = 1
    GROUP BY
        c.id,
        c.nombre
    ORDER BY
        c.nombre ASC;
END;
GO
