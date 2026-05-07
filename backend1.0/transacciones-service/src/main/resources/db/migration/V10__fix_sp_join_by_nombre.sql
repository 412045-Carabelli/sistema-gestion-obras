-- V10__fix_sp_join_by_nombre.sql
-- Arreglar SP para hacer JOIN a tipo_transaccion por nombre y agregar costos correctamente

DROP PROCEDURE IF EXISTS sp_deudas_globales_con_grupo;
DROP PROCEDURE IF EXISTS sp_deudas_proveedores_con_grupo;
GO

CREATE PROCEDURE sp_deudas_globales_con_grupo
  @grupoId     BIGINT = NULL,
  @obraId      BIGINT = NULL,
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL,
  @fechaInicio DATE   = NULL,
  @fechaFin    DATE   = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  -- CTE: Agregación de cobros por obra
  WITH cobros_por_obra AS (
    SELECT
      t.id_obra,
      ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'COBRO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS total_cobrado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    WHERE t.activo = 1
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
    GROUP BY t.id_obra
  )
  -- Detalle deuda clientes (con grupo)
  SELECT
    o.id_grupo AS grupoId,
    g.nombre AS grupoNombre,
    o.id AS obraId,
    o.nombre AS obraNombre,
    o.id_cliente AS clienteId,
    c.nombre AS clienteNombre,
    ISNULL(o.presupuesto, 0) AS presupuesto,
    ISNULL(cb.total_cobrado, 0) AS cobrado,
    ISNULL(o.presupuesto, 0) - ISNULL(cb.total_cobrado, 0) AS saldo
  FROM [sgo_obras].[dbo].[obras] o
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_clientes].[dbo].[clientes] c ON o.id_cliente = c.id
  LEFT JOIN cobros_por_obra cb ON o.id = cb.id_obra
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (ISNULL(o.presupuesto, 0) - ISNULL(cb.total_cobrado, 0) > 0)
  ORDER BY o.creado_en DESC, o.nombre;

END;
GO

CREATE PROCEDURE sp_deudas_proveedores_con_grupo
  @grupoId     BIGINT = NULL,
  @obraId      BIGINT = NULL,
  @proveedorId BIGINT = NULL,
  @fechaInicio DATE   = NULL,
  @fechaFin    DATE   = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  -- CTE: Agregación de costos por obra y proveedor
  WITH costos_por_obra_proveedor AS (
    SELECT
      oc.id_obra,
      oc.id_proveedor,
      ISNULL(SUM(oc.total), 0) AS total_presupuestado
    FROM [sgo_obras].[dbo].[obra_costo] oc
    WHERE oc.activo = 1
    GROUP BY oc.id_obra, oc.id_proveedor
  ),
  -- CTE: Agregación de pagos por obra y proveedor
  pagos_por_obra_proveedor AS (
    SELECT
      t.id_obra,
      t.id_asociado AS id_proveedor,
      ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS total_pagado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    WHERE t.activo = 1
      AND t.tipo_asociado = 'PROVEEDOR'
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
    ISNULL(cp.total_presupuestado, 0) AS presupuestado,
    ISNULL(pg.total_pagado, 0) AS pagado,
    ISNULL(cp.total_presupuestado, 0) - ISNULL(pg.total_pagado, 0) AS saldo
  FROM costos_por_obra_proveedor cp
  INNER JOIN [sgo_obras].[dbo].[obras] o ON cp.id_obra = o.id
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_proveedores].[dbo].[proveedores] p ON cp.id_proveedor = p.id
  LEFT JOIN pagos_por_obra_proveedor pg ON cp.id_obra = pg.id_obra AND cp.id_proveedor = pg.id_proveedor
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR cp.id_obra = @obraId)
    AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
    AND (ISNULL(cp.total_presupuestado, 0) - ISNULL(pg.total_pagado, 0) > 0)
  ORDER BY o.creado_en DESC, o.nombre;

END;
GO
