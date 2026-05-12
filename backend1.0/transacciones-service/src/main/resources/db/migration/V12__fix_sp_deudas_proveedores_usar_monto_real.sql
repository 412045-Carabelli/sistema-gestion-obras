-- V12__fix_sp_deudas_proveedores_usar_monto_real.sql
-- Actualiza sp_deudas_proveedores_con_grupo para usar monto_real en lugar de subtotal
-- monto_real es el gasto actual del proveedor; si no existe, usar subtotal (presupuestado)
-- Agrupa por obra-proveedor (no por costo individual) para sumar correctamente

CREATE OR ALTER PROCEDURE sp_deudas_proveedores_con_grupo
  @grupoId     BIGINT = NULL,
  @clienteId   BIGINT = NULL,
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

  -- CTE: Suma de costos presupuestados por obra y proveedor
  -- Prioriza monto_real si existe y es > 0, sino usa subtotal
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
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@obraId IS NULL OR cp.id_obra = @obraId)
    AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
  ORDER BY o.creado_en DESC, o.nombre;

END;
GO
