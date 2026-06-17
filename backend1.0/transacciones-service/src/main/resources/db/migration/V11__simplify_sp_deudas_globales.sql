-- V11__simplify_sp_deudas_globales.sql
-- Simplify and fix stored procedures for debt calculation

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

  -- Tabla de estados válidos
  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  -- CTE: Suma de cobros por obra
  WITH cobros_agregados AS (
    SELECT
      t.id_obra,
      SUM(CAST(t.monto AS DECIMAL(14,2))) AS total_cobrado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    WHERE t.activo = 1
      AND t.id_tipo_transaccion = 'COBRO'
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
    GROUP BY t.id_obra
  )
  -- Resultado principal
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
  FROM [sgo_obras].[dbo].[obras] o
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_clientes].[dbo].[clientes] c ON o.id_cliente = c.id
  LEFT JOIN cobros_agregados ca ON o.id = ca.id_obra
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (ISNULL(o.presupuesto, 0) - ISNULL(ca.total_cobrado, 0) > 0)
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

  -- Tabla de estados válidos
  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  -- CTE: Suma de costos presupuestados por obra y proveedor
  -- Prioriza monto_real si existe, sino usa subtotal (igual a TransaccionService.getMontoBaseCosto)
  WITH costos_presupuestados AS (
    SELECT
      oc.id_obra,
      oc.id_proveedor,
      SUM(CASE
        WHEN oc.monto_real IS NOT NULL AND oc.monto_real > 0 THEN CAST(oc.monto_real AS DECIMAL(14,2))
        ELSE CAST(oc.subtotal AS DECIMAL(14,2))
      END) AS total_presupuestado
    FROM [sgo_obras].[dbo].[obra_costo] oc
    WHERE oc.activo = 1
    GROUP BY oc.id_obra, oc.id_proveedor
  ),
  -- CTE: Suma de pagos realizados por obra y proveedor
  pagos_realizados AS (
    SELECT
      t.id_obra,
      t.id_asociado AS id_proveedor,
      SUM(CAST(t.monto AS DECIMAL(14,2))) AS total_pagado
    FROM [sgo_transacciones].[dbo].[transacciones] t
    WHERE t.activo = 1
      AND t.id_tipo_transaccion = 'PAGO'
      AND t.tipo_asociado = 'PROVEEDOR'
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
    GROUP BY t.id_obra, t.id_asociado
  )
  -- Resultado principal
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
  INNER JOIN [sgo_obras].[dbo].[obras] o ON cp.id_obra = o.id
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_proveedores].[dbo].[proveedores] p ON cp.id_proveedor = p.id
  LEFT JOIN pagos_realizados pr ON cp.id_obra = pr.id_obra AND cp.id_proveedor = pr.id_proveedor
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR cp.id_obra = @obraId)
    AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
    AND (ISNULL(cp.total_presupuestado, 0) - ISNULL(pr.total_pagado, 0) > 0)
  ORDER BY o.creado_en DESC, o.nombre;
END;
GO
