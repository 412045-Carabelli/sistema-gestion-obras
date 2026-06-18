-- V17__fix_sp_deudas_globales_usar_total_con_beneficio.sql
-- Corrige sp_deudas_globales_con_grupo para usar total_con_beneficio calculado
-- desde obra_costo (igual que presupuestoEfectivo() en Java).
-- Lógica: totalConBeneficio = SUM(subtotal * (1 + beneficioAplicado/100))
--   donde beneficioAplicado =
--     si tipo_costo = 'ORIGINAL' y beneficio_global = 1 → o.beneficio
--     sino → oc.beneficio
-- Si totalConBeneficio > 0 → úsalo como presupuesto; sino → usa o.presupuesto
-- Esto permite saldos negativos cuando el cliente pagó más que el presupuesto efectivo.

DROP PROCEDURE IF EXISTS sp_deudas_globales_con_grupo;
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
  ),
  presupuesto_efectivo AS (
    -- Replica presupuestoEfectivo() de Java:
    -- totalConBeneficio = SUM(subtotal * (1 + beneficioAplicado/100))
    SELECT
      oc.id_obra,
      SUM(
        CAST(ISNULL(oc.subtotal, 0) AS DECIMAL(18,6)) *
        (1.0 + CAST(
          CASE
            WHEN oc.tipo_costo = 'ORIGINAL' AND o.beneficio_global = 1
              THEN ISNULL(o.beneficio, 0)
            ELSE ISNULL(oc.beneficio, 0)
          END AS DECIMAL(14,6)) / 100.0)
      ) AS total_con_beneficio
    FROM [sgo_obras].[dbo].[obra_costo] oc
    INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
    WHERE (oc.activo = 1 OR oc.baja_obra = 1)
    GROUP BY oc.id_obra
  )
  SELECT
    o.id_grupo AS grupoId,
    g.nombre AS grupoNombre,
    o.id AS obraId,
    o.nombre AS obraNombre,
    o.id_cliente AS clienteId,
    c.nombre AS clienteNombre,
    -- Si totalConBeneficio > 0 → usar ese valor; sino → usar presupuesto original
    CAST(
      CASE
        WHEN ISNULL(pe.total_con_beneficio, 0) > 0 THEN pe.total_con_beneficio
        ELSE ISNULL(o.presupuesto, 0)
      END AS DECIMAL(14,2)
    ) AS presupuesto,
    CAST(ISNULL(ca.total_cobrado, 0) AS DECIMAL(14,2)) AS cobrado,
    CAST(
      CASE
        WHEN ISNULL(pe.total_con_beneficio, 0) > 0 THEN pe.total_con_beneficio
        ELSE ISNULL(o.presupuesto, 0)
      END - ISNULL(ca.total_cobrado, 0) AS DECIMAL(14,2)
    ) AS saldo
  FROM [sgo_obras].[dbo].[obras] o
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_clientes].[dbo].[clientes] c ON o.id_cliente = c.id
  LEFT JOIN cobros_agregados ca ON o.id = ca.id_obra
  LEFT JOIN presupuesto_efectivo pe ON o.id = pe.id_obra
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@proveedorId IS NULL OR EXISTS (SELECT 1 FROM [sgo_obras].[dbo].[obra_costo] oc WHERE oc.id_obra = o.id AND oc.id_proveedor = @proveedorId AND oc.activo = 1))
  ORDER BY o.creado_en DESC, o.nombre;
END;
GO
