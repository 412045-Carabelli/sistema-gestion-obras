-- V14__actualizar_sp_deudas_globales_con_proveedor.sql
-- Actualiza sp_deudas_globales_con_grupo para aceptar proveedorId y filtrar deudas de clientes
-- Solo por las obras donde ese proveedor aparece

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

  -- Tabla de estados válidos
  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  -- Si se filtra por proveedor, encontrar sus obras
  DECLARE @obrasDelProveedor TABLE (id BIGINT);
  IF @proveedorId IS NOT NULL
  BEGIN
    INSERT INTO @obrasDelProveedor
    SELECT DISTINCT o.id
    FROM [sgo_obras].[dbo].[obras] o
    INNER JOIN [sgo_obras].[dbo].[obra_costo] oc ON o.id = oc.id_obra
    WHERE oc.activo = 1
      AND o.activo = 1
      AND oc.id_proveedor = @proveedorId;
  END;

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
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@proveedorId IS NULL OR o.id IN (SELECT id FROM @obrasDelProveedor))
  ORDER BY o.creado_en DESC, o.nombre;
END;
GO
