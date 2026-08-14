-- V37__excluir_adicional_sin_proveedor_de_deuda_proveedores.sql
-- Un costo ADICIONAL/AJUSTE sin proveedor es ganancia pura (no hay proveedor real
-- que cobre ese monto): obras-service ya lo excluye del presupuesto de costos vía
-- AdicionalSinProveedorCostoStrategy. Pero este SP sumaba oc.subtotal de TODOS los
-- costos activos de una obra sin filtrar id_proveedor IS NOT NULL, generando una
-- fila "fantasma" en costos_presupuestados con id_proveedor = NULL y saldo > 0.
-- Esa fila aparecía en el listado de cuentas corrientes de proveedores (y en sus
-- totales) como una deuda sin proveedor asociado, cuando en realidad no debería
-- impactar la cuenta corriente de proveedores en absoluto.

CREATE OR ALTER PROCEDURE sp_deudas_proveedores_con_grupo
  @grupoId            BIGINT        = NULL,
  @obraId             BIGINT        = NULL,
  @proveedorId        BIGINT        = NULL,
  @fechaInicio        DATE          = NULL,
  @fechaFin            DATE          = NULL,
  @organizacion_id    BIGINT        = NULL,
  @schemaObras         NVARCHAR(128) = 'sgo_obras',
  @schemaProveedores   NVARCHAR(128) = 'sgo_proveedores',
  @schemaTransacciones NVARCHAR(128) = 'sgo_transacciones',
  @incluirSaldoCero    BIT           = 0
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @sql NVARCHAR(MAX) = N'
    WITH costos_presupuestados AS (
      SELECT
        oc.id_obra,
        oc.id_proveedor,
        SUM(CASE
          WHEN oc.monto_real IS NOT NULL THEN CAST(oc.monto_real AS DECIMAL(14,2))
          ELSE CAST(oc.subtotal AS DECIMAL(14,2))
        END) AS total_presupuestado
      FROM ' + QUOTENAME(@schemaObras) + N'.[dbo].[obra_costo] oc
      WHERE oc.activo = 1
        AND oc.id_proveedor IS NOT NULL
      GROUP BY oc.id_obra, oc.id_proveedor
    ),
    pagos_realizados AS (
      SELECT
        t.id_obra,
        t.id_asociado AS id_proveedor,
        SUM(CAST(t.monto AS DECIMAL(14,2))) AS total_pagado
      FROM ' + QUOTENAME(@schemaTransacciones) + N'.[dbo].[transacciones] t
      WHERE t.activo = 1
        AND t.id_tipo_transaccion = ''PAGO''
        AND t.tipo_asociado = ''PROVEEDOR''
        AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
        AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
      GROUP BY t.id_obra, t.id_asociado
    )
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
    INNER JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[obras] o ON cp.id_obra = o.id
    LEFT JOIN ' + QUOTENAME(@schemaObras) + N'.[dbo].[grupos_obras] g ON o.id_grupo = g.id
    LEFT JOIN ' + QUOTENAME(@schemaProveedores) + N'.[dbo].[proveedores] p ON cp.id_proveedor = p.id
    LEFT JOIN pagos_realizados pr ON cp.id_obra = pr.id_obra AND cp.id_proveedor = pr.id_proveedor
    WHERE o.activo = 1
      AND o.estado_obra IN (''ADJUDICADA'', ''EN_PROGRESO'', ''FINALIZADA'')
      AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
      AND (@grupoId IS NULL OR o.id_grupo = @grupoId)
      AND (@obraId IS NULL OR cp.id_obra = @obraId)
      AND (@proveedorId IS NULL OR cp.id_proveedor = @proveedorId)
      AND (@incluirSaldoCero = 1 OR (ISNULL(cp.total_presupuestado, 0) - ISNULL(pr.total_pagado, 0) > 0))
    ORDER BY o.creado_en DESC, o.nombre;';

  EXEC sp_executesql @sql,
    N'@grupoId BIGINT, @obraId BIGINT, @proveedorId BIGINT, @fechaInicio DATE, @fechaFin DATE, @organizacion_id BIGINT, @incluirSaldoCero BIT',
    @grupoId = @grupoId, @obraId = @obraId, @proveedorId = @proveedorId,
    @fechaInicio = @fechaInicio, @fechaFin = @fechaFin, @organizacion_id = @organizacion_id,
    @incluirSaldoCero = @incluirSaldoCero;
END;
GO

-- El widget "por pagar" del dashboard (sp_dashboard_cuenta_corriente, V29) sumaba
-- oc.total de TODOS los costos activos cuando no se filtra por un proveedor puntual
-- (@proveedorId IS NULL), incluyendo los ADICIONAL/AJUSTE sin proveedor. Mismo fix:
-- excluirlos del monto "por pagar a proveedores".
CREATE OR ALTER PROCEDURE sp_dashboard_cuenta_corriente
  @obraId         BIGINT = NULL,
  @clienteId      BIGINT = NULL,
  @proveedorId    BIGINT = NULL,
  @fechaInicio    DATE   = NULL,
  @fechaFin       DATE   = NULL,
  @organizacion_id BIGINT = NULL
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

  SELECT @cobrado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
  FROM transacciones t
  INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = CAST(tt.id AS VARCHAR(50))
  INNER JOIN [sgo_obras].[dbo].[obras] o ON t.id_obra = o.id
  WHERE t.activo = 1
    AND tt.nombre = 'COBRO'
    AND o.estado_obra IN (SELECT estado FROM @estadosValidos)
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
    AND (@obraId IS NULL OR t.id_obra = @obraId)
    AND (@clienteId IS NULL OR t.id_asociado = @clienteId)
    AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
    AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin);

  SELECT @pagado = ISNULL(SUM(CAST(t.monto AS DECIMAL(14, 2))), 0)
  FROM transacciones t
  INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = CAST(tt.id AS VARCHAR(50))
  INNER JOIN [sgo_obras].[dbo].[obras] o ON t.id_obra = o.id
  WHERE t.activo = 1
    AND tt.nombre = 'PAGO'
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
