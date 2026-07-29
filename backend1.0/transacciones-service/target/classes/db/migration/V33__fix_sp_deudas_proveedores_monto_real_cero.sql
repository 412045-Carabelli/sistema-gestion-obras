-- V33__fix_sp_deudas_proveedores_monto_real_cero.sql
-- sp_deudas_proveedores_con_grupo trataba monto_real = 0 igual que "sin gasto real
-- cargado" (la condicion exigia > 0), asi que un gasto real editado a $0 caia al
-- ELSE y seguia usando oc.subtotal (el costo original) como deuda. Un gasto real
-- de $0 es una anulacion explicita del costo, no la ausencia de dato: solo NULL
-- significa "sin gasto real cargado, usar el costo presupuestado".

CREATE OR ALTER PROCEDURE sp_deudas_proveedores_con_grupo
  @grupoId            BIGINT        = NULL,
  @obraId             BIGINT        = NULL,
  @proveedorId        BIGINT        = NULL,
  @fechaInicio        DATE          = NULL,
  @fechaFin           DATE          = NULL,
  @organizacion_id    BIGINT        = NULL,
  @schemaObras         NVARCHAR(128) = 'sgo_obras',
  @schemaProveedores   NVARCHAR(128) = 'sgo_proveedores',
  @schemaTransacciones NVARCHAR(128) = 'sgo_transacciones'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    WITH costos_presupuestados AS (
      SELECT
        oc.id_obra,
        oc.id_proveedor,
        SUM(CASE
          WHEN oc.monto_real IS NOT NULL THEN CAST(oc.monto_real AS DECIMAL(14,2))
          ELSE CAST(oc.subtotal AS DECIMAL(14,2))
        END) AS total_presupuestado
      FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc
      WHERE oc.activo = 1
      GROUP BY oc.id_obra, oc.id_proveedor
    ),
    pagos_realizados AS (
      SELECT
        t.id_obra,
        t.id_asociado AS id_proveedor,
        SUM(CAST(t.monto AS DECIMAL(14,2))) AS total_pagado
      FROM ' + QUOTENAME(@schemaTransacciones) + N'.[dbo].[transacciones] t
      WHERE t.activo = 1
        AND t.id_tipo_transaccion = ''PAGO''
        AND t.tipo_asociado = ''PROVEEDOR''
        AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
        AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
      GROUP BY t.id_obra, t.id_asociado
    )
    SELECT
      o.id_grupo AS grupoId,
      g.nombre AS grupoNombre,
      o.id AS obraId,
      o.nombre AS obraNombre,
      cp.id_proveedor AS proveedorId,
      p.nombre AS proveedorNombre,
      CAST(ISNULL(cp.total_presupuestado, 0) AS DECIMAL(14,2)) AS presupuestado,
      CAST(ISNULL(pr.total_pagado, 0) AS DECIMAL(14,2)) AS pagado,
      CAST(ISNULL(cp.total_presupuestado, 0) - ISNULL(pr.total_pagado, 0) AS DECIMAL(14,2)) AS saldo
    FROM costos_presupuestados cp
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON cp.id_obra = o.id
    LEFT JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[grupos_obras] g ON o.id_grupo = g.id
    LEFT JOIN ' + QUOTENAME(@schemaProveedores) + N'.[dbo].[proveedores] p ON cp.id_proveedor = p.id
    LEFT JOIN pagos_realizados pr ON cp.id_obra = pr.id_obra AND cp.id_proveedor = pr.id_proveedor
    WHERE o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
      AND (@obraId IS NULL OR cp.id_obra = @obraId)
      AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
      AND (ISNULL(cp.total_presupuestado, 0) - ISNULL(pr.total_pagado, 0) > 0)
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@grupoId BIGINT, @obraId BIGINT, @proveedorId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT',
    @grupoId = @grupoId, @obraId = @obraId, @proveedorId = @proveedorId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id;
END;
GO
