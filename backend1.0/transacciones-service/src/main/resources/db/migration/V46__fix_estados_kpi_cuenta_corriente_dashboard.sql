-- V46__fix_estados_kpi_cuenta_corriente_dashboard.sql
--
-- Los KPI "Por cobrar"/"Por pagar" de la pantalla de Reportes (sp_dashboard_cuenta_corriente)
-- daban numeros mucho mas altos que los mismos KPI en Cuentas Corrientes porque el set de
-- estados por defecto incluia COBRADA, FACTURADA y FACTURADA_PARCIAL ademas de
-- ADJUDICADA/EN_PROGRESO/FINALIZADA. Cuentas Corrientes (sp_deudas_globales_con_grupo, V36)
-- solo usa ADJUDICADA/EN_PROGRESO/FINALIZADA. Se unifica el default a ese mismo set para que
-- ambas pantallas muestren el mismo numero. El parametro @estados (V41) sigue permitiendo
-- restringir aun mas via interseccion; no se toca esa logica.
--
-- NOTA: esta migracion partio por error de V41 y perdio la parametrizacion de @schemaObras
-- que V44 le habia agregado (referenciaba [sgo_obras] hardcodeado = produccion, rompiendo
-- dev). Ya fue aplicada asi en algunos entornos, asi que no se edita retroactivamente
-- (rompe el checksum de Flyway) -- el fix real esta en V48.

CREATE OR ALTER PROCEDURE sp_dashboard_cuenta_corriente
  @obraId          BIGINT        = NULL,
  @clienteId       BIGINT        = NULL,
  @proveedorId     BIGINT        = NULL,
  @fechaInicio     DATE          = NULL,
  @fechaFin        DATE          = NULL,
  @organizacion_id BIGINT        = NULL,
  @estados         NVARCHAR(500) = NULL
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
    ('ADJUDICADA'), ('EN_PROGRESO'), ('FINALIZADA');

  IF @estados IS NOT NULL
    DELETE FROM @estadosValidos WHERE estado NOT IN (SELECT value FROM STRING_SPLIT(@estados, ','));

  SELECT @cobrado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
  FROM transacciones t
  INNER JOIN [sgo_obras].[dbo].[obras] o ON t.id_obra = o.id
  WHERE t.activo = 1
    AND t.id_tipo_transaccion = 'COBRO'
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
    AND (@obraId IS NULL OR t.id_obra = @obraId)
    AND (@clienteId IS NULL OR t.id_asociado = @clienteId)
    AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
    AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin);

  SELECT @pagado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
  FROM transacciones t
  INNER JOIN [sgo_obras].[dbo].[obras] o ON t.id_obra = o.id
  WHERE t.activo = 1
    AND t.id_tipo_transaccion = 'PAGO'
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
    AND (@obraId IS NULL OR t.id_obra = @obraId)
    AND (@proveedorId IS NULL OR t.id_asociado = @proveedorId)
    AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
    AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin);

  SELECT @presupuestoTotal = ISNULL(SUM(o.presupuesto), 0)
  FROM [sgo_obras].[dbo].[obras] o
  WHERE o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId);

  -- ECONOMIA excluida: no genera obligacion de pago a proveedores.
  -- ADICIONAL/AJUSTE sin proveedor tampoco: es ganancia pura, no hay proveedor a pagar.
  SELECT @costosTotal = ISNULL(SUM(oc.total), 0)
  FROM [sgo_obras].[dbo].[obra_costo] oc
  INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
  WHERE oc.activo = 1
    AND o.activo = 1
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
    AND (@obraId IS NULL OR oc.id_obra = @obraId)
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND oc.id_proveedor IS NOT NULL
    AND ISNULL(oc.tipo_costo, '') <> 'ECONOMIA';

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
