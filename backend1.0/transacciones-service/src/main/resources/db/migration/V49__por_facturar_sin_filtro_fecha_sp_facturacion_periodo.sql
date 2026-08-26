-- V49__por_facturar_sin_filtro_fecha_sp_facturacion_periodo.sql
--
-- "Por facturar" en Reportes seguia sin coincidir con Facturacion (FacturaBffController.
-- getResumen, api-gateway): esa pantalla no aplica ningun filtro de fecha, calcula
-- porFacturar = presupuesto - facturado HISTORICO TOTAL de la obra. sp_facturacion_periodo
-- (V47) restaba solo el facturado DENTRO del rango de fechas del filtro, inflando el saldo
-- para cualquier obra con facturas viejas fuera de esa ventana -- mismo problema que V48
-- ya resolvio para el saldo de cuenta corriente.
--
-- Fix: se separa el facturado en dos CTEs. "facturado" (columna de la tabla, respeta fechas)
-- sigue sirviendo para el reporte de facturacion del periodo. "porFacturar" ahora se calcula
-- contra el facturado historico completo (sin fechas), igual que Facturacion.

CREATE OR ALTER PROCEDURE sp_facturacion_periodo
  @obraId          BIGINT        = NULL,
  @clienteId       BIGINT        = NULL,
  @fechaInicio     DATE          = NULL,
  @fechaFin        DATE          = NULL,
  @organizacion_id BIGINT        = NULL,
  @schemaObras     NVARCHAR(128) = 'sgo_obras',
  @schemaClientes  NVARCHAR(128) = 'sgo_clientes',
  @estados         NVARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    WITH facturado_agregado AS (
      SELECT
        f.id_obra,
        SUM(CAST(f.monto AS DECIMAL(14,2))) AS total_facturado
      FROM [dbo].[facturas] f
      WHERE f.activo = 1
        AND (@fechaInicio IS NULL OR CAST(f.fecha AS DATE) >= @fechaInicio)
        AND (@fechaFin IS NULL OR CAST(f.fecha AS DATE) <= @fechaFin)
      GROUP BY f.id_obra
    ),
    facturado_historico AS (
      SELECT
        f.id_obra,
        SUM(CAST(f.monto AS DECIMAL(14,2))) AS total_facturado
      FROM [dbo].[facturas] f
      WHERE f.activo = 1
      GROUP BY f.id_obra
    )
    SELECT
      o.id AS obraId,
      o.nombre AS obraNombre,
      o.id_cliente AS clienteId,
      c.nombre AS clienteNombre,
      CAST(ISNULL(o.presupuesto, 0) AS DECIMAL(14,2)) AS presupuesto,
      CAST(ISNULL(fa.total_facturado, 0) AS DECIMAL(14,2)) AS facturado,
      CAST(CASE WHEN ISNULL(o.presupuesto, 0) - ISNULL(fh.total_facturado, 0) > 0
                THEN ISNULL(o.presupuesto, 0) - ISNULL(fh.total_facturado, 0)
                ELSE 0 END AS DECIMAL(14,2)) AS porFacturar
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    LEFT JOIN ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c ON o.id_cliente = c.id
    LEFT JOIN facturado_agregado fa ON o.id = fa.id_obra
    LEFT JOIN facturado_historico fh ON o.id = fh.id_obra
    WHERE o.activo = 1
      AND o.requiere_factura = 1
      AND o.estado_obra IN (''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'', ''FACTURADA'', ''FACTURADA_PARCIAL'', ''COBRADA'')
      AND (@estados IS NULL OR o.estado_obra IN (SELECT value FROM STRING_SPLIT(@estados, '','')))
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
      AND (ISNULL(fa.total_facturado, 0) > 0 OR ISNULL(o.presupuesto, 0) > 0)
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@obraId BIGINT, @clienteId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT, @estados NVARCHAR(500)',
    @obraId = @obraId, @clienteId = @clienteId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id,
    @estados = @estados;
END;
GO
