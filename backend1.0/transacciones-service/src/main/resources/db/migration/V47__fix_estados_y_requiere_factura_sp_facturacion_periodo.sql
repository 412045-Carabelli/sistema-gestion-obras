-- V47__fix_estados_y_requiere_factura_sp_facturacion_periodo.sql
--
-- El KPI "Por facturar" de Reportes (sp_facturacion_periodo) daba numeros mucho mas altos
-- que el mismo KPI en la pantalla de Facturas (ReportesService.generarKpiFacturas) por dos
-- motivos:
-- 1. Incluia obras en estado COTIZADA. COTIZADA es una cotizacion sin confirmar: no genera
--    deuda ni debe aparecer en ningun KPI de cuenta corriente/facturacion (regla de negocio
--    ya aplicada en V35 para cuentas corrientes, nunca se aplico aca).
-- 2. No filtraba por o.requiere_factura = 1, sumando presupuesto de obras que ni siquiera
--    requieren facturacion. La pantalla de Facturas si filtra por ese flag.
-- Se alinea el set de estados con ESTADOS_KPI_FACTURAS (ReportesService.java) y se agrega
-- el filtro de requiere_factura, para que ambas pantallas coincidan.

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
    )
    SELECT
      o.id AS obraId,
      o.nombre AS obraNombre,
      o.id_cliente AS clienteId,
      c.nombre AS clienteNombre,
      CAST(ISNULL(o.presupuesto, 0) AS DECIMAL(14,2)) AS presupuesto,
      CAST(ISNULL(fa.total_facturado, 0) AS DECIMAL(14,2)) AS facturado,
      CAST(CASE WHEN ISNULL(o.presupuesto, 0) - ISNULL(fa.total_facturado, 0) > 0
                THEN ISNULL(o.presupuesto, 0) - ISNULL(fa.total_facturado, 0)
                ELSE 0 END AS DECIMAL(14,2)) AS porFacturar
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    LEFT JOIN ' + QUOTENAME(@schemaClientes) + N'.[dbo].[clientes] c ON o.id_cliente = c.id
    LEFT JOIN facturado_agregado fa ON o.id = fa.id_obra
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
