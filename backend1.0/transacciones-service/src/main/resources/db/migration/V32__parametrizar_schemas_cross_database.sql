-- V32__parametrizar_schemas_cross_database.sql
-- Los SPs de cuentas corrientes referenciaban [sgo_obras], [sgo_clientes],
-- [sgo_proveedores] y [sgo_transacciones] hardcodeados (nombres de PRODUCCION).
-- En dev cada servicio usa una base con sufijo _test (sgo_obras_test, etc.),
-- asi que estos SPs leian datos de produccion aun corriendo en dev. Se
-- convierten a SQL dinamico para que el nombre de cada base se pase como
-- parametro (Java lo inyecta segun el profile activo).

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
  @schemaTransacciones NVARCHAR(128) = 'sgo_transacciones'
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
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (ISNULL(o.presupuesto, 0) - ISNULL(ca.total_cobrado, 0) > 0)
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@grupoId BIGINT, @obraId BIGINT, @clienteId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT',
    @grupoId = @grupoId, @obraId = @obraId, @clienteId = @clienteId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id;
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
          WHEN oc.monto_real IS NOT NULL AND oc.monto_real > 0 THEN CAST(oc.monto_real AS DECIMAL(14,2))
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

CREATE OR ALTER PROCEDURE sp_obtener_obras_por_cliente
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL,
  @obraId      BIGINT = NULL,
  @schemaObras NVARCHAR(128) = 'sgo_obras'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      o.id,
      o.nombre,
      o.estado_obra AS estado
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    LEFT JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON o.id = oc.id_obra AND oc.activo = 1
    WHERE o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
      AND (@obraId IS NULL OR o.id = @obraId)
    ORDER BY o.nombre;';

  EXEC sp_executesql @sql,
    N'@clienteId BIGINT, @proveedorId BIGINT, @obraId BIGINT',
    @clienteId = @clienteId, @proveedorId = @proveedorId, @obraId = @obraId;
END;
GO

CREATE OR ALTER PROCEDURE sp_obtener_proveedores_por_cliente
  @clienteId       BIGINT        = NULL,
  @proveedorId     BIGINT        = NULL,
  @obraId          BIGINT        = NULL,
  @schemaObras       NVARCHAR(128) = 'sgo_obras',
  @schemaProveedores NVARCHAR(128) = 'sgo_proveedores'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      p.id,
      p.nombre
    FROM ' + QUOTENAME(@schemaProveedores) + N'.[dbo].[proveedores] p
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON p.id = oc.id_proveedor
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON oc.id_obra = o.id
    WHERE oc.activo = 1
      AND o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (@proveedorId IS NULL OR p.id = @proveedorId)
      AND (@obraId IS NULL OR oc.id_obra = @obraId)
    ORDER BY p.nombre;';

  EXEC sp_executesql @sql,
    N'@clienteId BIGINT, @proveedorId BIGINT, @obraId BIGINT',
    @clienteId = @clienteId, @proveedorId = @proveedorId, @obraId = @obraId;
END;
GO

CREATE OR ALTER PROCEDURE sp_obtener_obras_por_proveedor
  @proveedorId   BIGINT        = NULL,
  @clienteId     BIGINT        = NULL,
  @obraId        BIGINT        = NULL,
  @schemaObras    NVARCHAR(128) = 'sgo_obras',
  @schemaClientes NVARCHAR(128) = 'sgo_clientes'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      o.id,
      o.nombre,
      o.estado_obra AS estado,
      o.id_cliente AS clienteId,
      c.nombre AS clienteNombre
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON o.id = oc.id_obra
    LEFT JOIN ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c ON o.id_cliente = c.id
    WHERE oc.activo = 1
      AND o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (@obraId IS NULL OR o.id = @obraId)
    ORDER BY o.nombre;';

  EXEC sp_executesql @sql,
    N'@proveedorId BIGINT, @clienteId BIGINT, @obraId BIGINT',
    @proveedorId = @proveedorId, @clienteId = @clienteId, @obraId = @obraId;
END;
GO

CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_proveedor
  @proveedorId   BIGINT        = NULL,
  @clienteId     BIGINT        = NULL,
  @obraId        BIGINT        = NULL,
  @schemaObras    NVARCHAR(128) = 'sgo_obras',
  @schemaClientes NVARCHAR(128) = 'sgo_clientes'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      c.id,
      c.nombre
    FROM ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON c.id = o.id_cliente
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON o.id = oc.id_obra
    WHERE oc.activo = 1
      AND o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
      AND (@clienteId IS NULL OR c.id = @clienteId)
      AND (@obraId IS NULL OR o.id = @obraId)
    ORDER BY c.nombre;';

  EXEC sp_executesql @sql,
    N'@proveedorId BIGINT, @clienteId BIGINT, @obraId BIGINT',
    @proveedorId = @proveedorId, @clienteId = @clienteId, @obraId = @obraId;
END;
GO

CREATE OR ALTER PROCEDURE sp_obtener_proveedores_por_obra
  @obraId            BIGINT        = NULL,
  @clienteId         BIGINT        = NULL,
  @proveedorId       BIGINT        = NULL,
  @schemaObras        NVARCHAR(128) = 'sgo_obras',
  @schemaProveedores  NVARCHAR(128) = 'sgo_proveedores'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      p.id,
      p.nombre
    FROM ' + QUOTENAME(@schemaProveedores) + N'.[dbo].[proveedores] p
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON p.id = oc.id_proveedor
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON oc.id_obra = o.id
    WHERE oc.activo = 1
      AND o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (@proveedorId IS NULL OR p.id = @proveedorId)
    ORDER BY p.nombre;';

  EXEC sp_executesql @sql,
    N'@obraId BIGINT, @clienteId BIGINT, @proveedorId BIGINT',
    @obraId = @obraId, @clienteId = @clienteId, @proveedorId = @proveedorId;
END;
GO

CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_obra
  @obraId         BIGINT        = NULL,
  @clienteId      BIGINT        = NULL,
  @proveedorId    BIGINT        = NULL,
  @schemaObras     NVARCHAR(128) = 'sgo_obras',
  @schemaClientes  NVARCHAR(128) = 'sgo_clientes'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    SELECT DISTINCT
      c.id,
      c.nombre
    FROM ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON c.id = o.id_cliente
    LEFT JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc ON o.id = oc.id_obra AND oc.activo = 1
    WHERE o.activo = 1
      AND o.estado_obra IN (''COTIZADA'', ''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR c.id = @clienteId)
      AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    ORDER BY c.nombre;';

  EXEC sp_executesql @sql,
    N'@obraId BIGINT, @clienteId BIGINT, @proveedorId BIGINT',
    @obraId = @obraId, @clienteId = @clienteId, @proveedorId = @proveedorId;
END;
GO
