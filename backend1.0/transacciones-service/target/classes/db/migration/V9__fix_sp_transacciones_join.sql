-- V9__fix_sp_transacciones_join.sql
-- Corregir JOIN con transacciones para que incluya correctamente los cobros y pagos

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
      ISNULL(SUM(CASE WHEN tt.nombre = 'COBRO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS total_cobrado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    LEFT JOIN [sgo_transacciones].[dbo].[tipo_transaccion] tt ON CAST(t.id_tipo_transaccion AS BIGINT) = tt.id
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

  -- CTE: Agregación de pagos por obra y proveedor
  WITH pagos_por_obra_proveedor AS (
    SELECT
      t.id_obra,
      t.id_asociado AS id_proveedor,
      ISNULL(SUM(CASE WHEN tt.nombre = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS total_pagado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    LEFT JOIN [sgo_transacciones].[dbo].[tipo_transaccion] tt ON CAST(t.id_tipo_transaccion AS BIGINT) = tt.id
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
    oc.id_proveedor AS proveedorId,
    p.nombre AS proveedorNombre,
    ISNULL(oc.total, 0) AS presupuestado,
    ISNULL(pg.total_pagado, 0) AS pagado,
    ISNULL(oc.total, 0) - ISNULL(pg.total_pagado, 0) AS saldo
  FROM [sgo_obras].[dbo].[obra_costo] oc
  INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_proveedores].[dbo].[proveedores] p ON oc.id_proveedor = p.id
  LEFT JOIN pagos_por_obra_proveedor pg ON o.id = pg.id_obra AND oc.id_proveedor = pg.id_proveedor
  WHERE oc.activo = 1
    AND o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR oc.id_obra = @obraId)
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND (ISNULL(oc.total, 0) - ISNULL(pg.total_pagado, 0) > 0)
  ORDER BY o.creado_en DESC, o.nombre;

END;
GO
