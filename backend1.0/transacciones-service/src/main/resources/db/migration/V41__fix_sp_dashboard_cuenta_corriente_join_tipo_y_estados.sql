-- V41__fix_sp_dashboard_cuenta_corriente_join_tipo_y_estados.sql
--
-- Fix 1: cobrado/pagado siempre daban 0. El calculo hacia
--   INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = CAST(tt.id AS VARCHAR(50))
--   WHERE tt.nombre = 'COBRO'
-- pero t.id_tipo_transaccion es VARCHAR(50) y ya guarda el literal 'COBRO'/'PAGO'
-- (@Enumerated(EnumType.STRING) en Transaccion.java, columna VARCHAR(50) en V1).
-- El join comparaba ese string contra el id numerico de tipo_transaccion casteado a
-- texto (ej. '1', '2') -> nunca matcheaba -> 0 filas -> cobrado/pagado en 0. El mismo
-- patron de bug ya se habia identificado y arreglado en otro SP (V25); nunca se
-- aplico a este. Fix: comparar t.id_tipo_transaccion directo contra el literal,
-- sin el join (igual que hace sp_deudas_proveedores_con_grupo, V37).
--
-- Fix 2 (aditivo, no rompe callers existentes): nuevo parametro opcional @estados,
-- lista de estados separados por coma. Si se pasa, RESTRINGE dentro del set de
-- estados validos ya hardcodeado (interseccion) - no lo reemplaza. NULL = comportamiento
-- identico al actual (todos los estados validos).

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
    ('ADJUDICADA'), ('EN_PROGRESO'), ('COBRADA'), ('FACTURADA'), ('FACTURADA_PARCIAL'), ('FINALIZADA');

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
