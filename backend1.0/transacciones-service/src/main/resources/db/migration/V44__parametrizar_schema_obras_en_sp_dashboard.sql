-- V44__parametrizar_schema_obras_en_sp_dashboard.sql
--
-- sp_dashboard_cuenta_corriente nunca recibio el mismo tratamiento que V32 le dio
-- a sp_deudas_globales_con_grupo y compania: referenciaba [sgo_obras] hardcodeado
-- (nombre de PRODUCCION) en vez de parametrizar el schema. En dev, los datos reales
-- viven en sgo_obras_test; como [sgo_obras] (prod) tambien existe en la misma
-- instancia de SQL Server, la query no fallaba, simplemente no encontraba la obra
-- (0 filas) y todo quedaba en 0 -- salvo, por coincidencia, obras viejas que existen
-- con el mismo id en ambas bases. Fix: mismo patron SQL dinamico + QUOTENAME que V32,
-- con @schemaObras inyectado por Java segun el profile activo (db.schema.obras).

CREATE OR ALTER PROCEDURE sp_dashboard_cuenta_corriente
  @obraId          BIGINT        = NULL,
  @clienteId       BIGINT        = NULL,
  @proveedorId     BIGINT        = NULL,
  @fechaInicio     DATE          = NULL,
  @fechaFin        DATE          = NULL,
  @organizacion_id BIGINT        = NULL,
  @estados         NVARCHAR(500) = NULL,
  @schemaObras     NVARCHAR(128) = 'sgo_obras'
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @cobrado DECIMAL(14, 2) = 0;
  DECLARE @pagado DECIMAL(14, 2) = 0;
  DECLARE @presupuestoTotal DECIMAL(14, 2) = 0;
  DECLARE @costosTotal DECIMAL(14, 2) = 0;
  DECLARE @porCobrar DECIMAL(14, 2) = 0;
  DECLARE @porPagar DECIMAL(14, 2) = 0;
  DECLARE @resultado DECIMAL(14, 2) = 0;

  DECLARE @estadosValidos TABLE (estado NVARCHAR(50));
  INSERT INTO @estadosValidos VALUES
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

  IF @estados IS NOT NULL
    DELETE FROM @estadosValidos WHERE estado NOT IN (SELECT value FROM STRING_SPLIT(@estados, ','));

  DECLARE @estadosCsv NVARCHAR(500) = (SELECT STRING_AGG(estado, ',') FROM @estadosValidos);

  DECLARE @sql NVARCHAR(MAX);
  DECLARE @params NVARCHAR(MAX) =
    N'@obraId BIGINT, @clienteId BIGINT, @proveedorId BIGINT, @fechaInicio DATE, @fechaFin DATE, ' +
    N'@organizacion_id BIGINT, @estadosCsv NVARCHAR(500), @cobrado DECIMAL(14,2) OUTPUT, @pagado DECIMAL(14,2) OUTPUT, ' +
    N'@presupuestoTotal DECIMAL(14,2) OUTPUT, @costosTotal DECIMAL(14,2) OUTPUT';

  SET @sql = N'
    SELECT @cobrado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
    FROM transacciones t
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON t.id_obra = o.id
    WHERE t.activo = 1
      AND t.id_tipo_transaccion = ''COBRO''
      AND o.estado_obra IN (SELECT value FROM STRING_SPLIT(@estadosCsv, '',''))
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@obraId IS NULL OR t.id_obra = @obraId)
      AND (@clienteId IS NULL OR t.id_asociado = @clienteId)
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin);

    SELECT @pagado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
    FROM transacciones t
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON t.id_obra = o.id
    WHERE t.activo = 1
      AND t.id_tipo_transaccion = ''PAGO''
      AND o.estado_obra IN (SELECT value FROM STRING_SPLIT(@estadosCsv, '',''))
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@obraId IS NULL OR t.id_obra = @obraId)
      AND (@proveedorId IS NULL OR t.id_asociado = @proveedorId)
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin);

    SELECT @presupuestoTotal = ISNULL(SUM(o.presupuesto), 0)
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o
    WHERE o.activo = 1
      AND o.estado_obra IN (SELECT value FROM STRING_SPLIT(@estadosCsv, '',''))
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@obraId IS NULL OR o.id = @obraId)
      AND (@clienteId IS NULL OR o.id_cliente = @clienteId);

    SELECT @costosTotal = ISNULL(SUM(oc.total), 0)
    FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON oc.id_obra = o.id
    WHERE oc.activo = 1
      AND o.activo = 1
      AND o.estado_obra IN (SELECT value FROM STRING_SPLIT(@estadosCsv, '',''))
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@obraId IS NULL OR oc.id_obra = @obraId)
      AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
      AND oc.id_proveedor IS NOT NULL
      AND ISNULL(oc.tipo_costo, '''') <> ''ECONOMIA'';';

  EXEC sp_executesql @sql, @params,
    @obraId = @obraId, @clienteId = @clienteId, @proveedorId = @proveedorId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id,
    @estadosCsv = @estadosCsv,
    @cobrado = @cobrado OUTPUT, @pagado = @pagado OUTPUT,
    @presupuestoTotal = @presupuestoTotal OUTPUT, @costosTotal = @costosTotal OUTPUT;

  SET @porCobrar = @presupuestoTotal - @cobrado;
  IF @porCobrar < 0 SET @porCobrar = 0;

  SET @porPagar = @costosTotal - @pagado;
  IF @porPagar < 0 SET @porPagar = 0;

  SET @resultado = @cobrado - @pagado;

  SELECT
    @cobrado AS cobrado,
    @porCobrar AS por_cobrar,
    @pagado AS pagado,
    @porPagar AS por_pagar,
    @resultado AS resultado;
END;
GO
