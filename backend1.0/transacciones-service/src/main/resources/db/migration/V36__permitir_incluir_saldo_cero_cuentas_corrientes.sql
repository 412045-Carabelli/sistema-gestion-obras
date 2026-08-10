-- V36__permitir_incluir_saldo_cero_cuentas_corrientes.sql
-- Agrega el parametro @incluirSaldoCero a los SPs de deudas globales para que
-- el listado de cuentas corrientes pueda mostrar tambien obras/proveedores
-- sin deuda pendiente (saldo = 0), cuando el usuario tilda el filtro
-- correspondiente. Por defecto (0) se mantiene el comportamiento actual.

CREATE OR ALTER PROCEDURE sp_deudas_globales_con_grupo
  @grupoId            BIGINT        = NULL,
  @obraId             BIGINT        = NULL,
  @clienteId          BIGINT        = NULL,
  @proveedorId        BIGINT        = NULL,
  @fechaInicio        DATE          = NULL,
  @fechaFin           DATE          = NULL,
  @organizacion_id    BIGINT        = NULL,
  @schemaObras         NVARCHAR(128) = 'sgo_obras',
  @schemaClientes      NVARCHAR(128) = 'sgo_clientes',
  @schemaTransacciones NVARCHAR(128) = 'sgo_transacciones',
  @incluirSaldoCero    BIT           = 0
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    WITH cobros_agregados AS (
      SELECT
        t.id_obra,
        SUM(CAST(t.monto AS DECIMAL(14,2))) AS total_cobrado
      FROM ' + QUOTENAME(@schemaTransacciones) + N'.[dbo].[transacciones] t
      WHERE t.activo = 1
        AND t.id_tipo_transaccion = ''COBRO''
        AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
        AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
      GROUP BY t.id_obra
    )
    SELECT
      o.id_grupo AS grupoId,
      g.nombre AS grupoNombre,
      o.id AS obraId,
      o.nombre AS obraNombre,
      o.id_cliente AS clienteId,
      c.nombre AS clienteNombre,
      CAST(ISNULL(o.presupuesto, 0) AS DECIMAL(14,2)) AS presupuesto,
      CAST(ISNULL(ca.total_cobrado, 0) AS DECIMAL(14,2)) AS cobrado,
      CAST(ISNULL(o.presupuesto, 0) - ISNULL(ca.total_cobrado, 0) AS DECIMAL(14,2)) AS saldo
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    LEFT JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[grupos_obras] g ON o.id_grupo = g.id
    LEFT JOIN ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c ON o.id_cliente = c.id
    LEFT JOIN cobros_agregados ca ON o.id = ca.id_obra
    WHERE o.activo = 1
      AND o.estado_obra IN (''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (@incluirSaldoCero = 1 OR (ISNULL(o.presupuesto, 0) - ISNULL(ca.total_cobrado, 0) > 0))
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@grupoId BIGINT, @obraId BIGINT, @clienteId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT, @incluirSaldoCero BIT',
    @grupoId = @grupoId, @obraId = @obraId, @clienteId = @clienteId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id,
    @incluirSaldoCero = @incluirSaldoCero;
END;
GO

CREATE OR ALTER PROCEDURE sp_deudas_proveedores_con_grupo
  @grupoId            BIGINT        = NULL,
  @obraId             BIGINT        = NULL,
  @proveedorId        BIGINT        = NULL,
  @fechaInicio        DATE          = NULL,
  @fechaFin           DATE          = NULL,
  @organizacion_id    BIGINT        = NULL,
  @schemaObras         NVARCHAR(128) = 'sgo_obras',
  @schemaProveedores   NVARCHAR(128) = 'sgo_proveedores',
  @schemaTransacciones NVARCHAR(128) = 'sgo_transacciones',
  @incluirSaldoCero    BIT           = 0
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
      AND o.estado_obra IN (''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
      AND (@obraId IS NULL OR cp.id_obra = @obraId)
      AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
      AND (@incluirSaldoCero = 1 OR (ISNULL(cp.total_presupuestado, 0) - ISNULL(pr.total_pagado, 0) > 0))
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@grupoId BIGINT, @obraId BIGINT, @proveedorId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT, @incluirSaldoCero BIT',
    @grupoId = @grupoId, @obraId = @obraId, @proveedorId = @proveedorId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id,
    @incluirSaldoCero = @incluirSaldoCero;
END;
GO
