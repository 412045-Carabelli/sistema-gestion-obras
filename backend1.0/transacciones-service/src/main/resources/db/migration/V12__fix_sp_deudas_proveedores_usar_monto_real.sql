-- V10__fix_sp_deudas_proveedores_usar_monto_real.sql
-- Actualiza sp_deudas_proveedores_con_grupo para usar monto_real en lugar de total
-- monto_real es el gasto actual del proveedor; si no existe, usar total (presupuestado)

CREATE OR ALTER PROCEDURE sp_deudas_proveedores_con_grupo
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

  SELECT
    o.id_grupo AS grupoId,
    g.nombre AS grupoNombre,
    o.id AS obraId,
    o.nombre AS obraNombre,
    oc.id_proveedor AS proveedorId,
    p.nombre AS proveedorNombre,
    ISNULL(SUM(ISNULL(oc.monto_real, oc.total)), 0) AS presupuestado,
    ISNULL(SUM(CASE WHEN tt.nombre = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS pagado,
    ISNULL(SUM(ISNULL(oc.monto_real, oc.total)), 0) - ISNULL(SUM(CASE WHEN tt.nombre = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) AS saldo
  FROM [sgo_obras].[dbo].[obra_costo] oc
  INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
  LEFT JOIN [sgo_obras].[dbo].[grupos_obras] g ON o.id_grupo = g.id
  LEFT JOIN [sgo_proveedores].[dbo].[proveedores] p ON oc.id_proveedor = p.id
  LEFT JOIN [sgo_transacciones].[dbo].[transacciones] t ON o.id = t.id_obra AND oc.id_proveedor = t.id_asociado AND t.activo = 1
  LEFT JOIN [sgo_transacciones].[dbo].[tipo_transaccion] tt ON CAST(t.id_tipo_transaccion AS BIGINT) = tt.id AND tt.nombre = 'PAGO'
  WHERE oc.activo = 1
    AND o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
    AND (@obraId IS NULL OR oc.id_obra = @obraId)
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND (@fechaInicio IS NULL OR CAST(ISNULL(t.fecha, o.creado_en) AS DATE) >= @fechaInicio)
    AND (@fechaFin IS NULL OR CAST(ISNULL(t.fecha, o.creado_en) AS DATE) <= @fechaFin)
  GROUP BY o.id_grupo, g.nombre, o.id, o.nombre, oc.id_proveedor, p.nombre, o.creado_en
  HAVING ISNULL(SUM(ISNULL(oc.monto_real, oc.total)), 0) - ISNULL(SUM(CASE WHEN tt.nombre = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) > 0
  ORDER BY o.creado_en DESC, o.nombre;

END;
GO
