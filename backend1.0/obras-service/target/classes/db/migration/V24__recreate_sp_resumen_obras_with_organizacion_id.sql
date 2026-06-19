CREATE OR ALTER PROCEDURE sp_resumen_obras_clientes
    @organizacion_id BIGINT
AS
BEGIN
  SELECT
    c.id AS id_cliente,
    c.nombre AS nombre_cliente,
    o.id AS id_obra,
    o.nombre AS nombre_obra,
    ISNULL(o.presupuesto, 0) AS presupuestado,
    ISNULL((
      SELECT SUM(CAST(monto AS DECIMAL(14,2)))
      FROM transacciones t
      INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = tt.id
      WHERE t.id_obra = o.id
        AND tt.nombre = 'COBRO'
        AND t.tipo_asociado = 'CLIENTE'
        AND t.id_asociado = c.id
        AND t.activo = 1
    ), 0) AS cobros_realizados,
    ISNULL(o.presupuesto, 0) - ISNULL((
      SELECT SUM(CAST(monto AS DECIMAL(14,2)))
      FROM transacciones t
      INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = tt.id
      WHERE t.id_obra = o.id
        AND tt.nombre = 'COBRO'
        AND t.tipo_asociado = 'CLIENTE'
        AND t.id_asociado = c.id
        AND t.activo = 1
    ), 0) AS saldo
  FROM clientes c
  INNER JOIN obras o ON c.id = o.id_cliente AND o.activo = 1 AND o.organizacion_id = @organizacion_id
  WHERE c.activo = 1
    AND c.organizacion_id = @organizacion_id
  ORDER BY c.nombre ASC, o.nombre ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_resumen_obras_proveedores
    @organizacion_id BIGINT
AS
BEGIN
  SELECT
    p.id AS id_proveedor,
    p.nombre AS nombre_proveedor,
    o.id AS id_obra,
    o.nombre AS nombre_obra,
    ISNULL((
      SELECT SUM(CAST(subtotal AS DECIMAL(14,2)))
      FROM obra_costo oc
      WHERE oc.id_obra = o.id
        AND oc.id_proveedor = p.id
        AND oc.activo = 1
    ), 0) AS costos,
    ISNULL((
      SELECT SUM(CAST(monto AS DECIMAL(14,2)))
      FROM transacciones t
      INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = tt.id
      WHERE t.id_obra = o.id
        AND tt.nombre = 'PAGO'
        AND t.tipo_asociado = 'PROVEEDOR'
        AND t.id_asociado = p.id
        AND t.activo = 1
    ), 0) AS pagos_realizados,
    ISNULL((
      SELECT SUM(CAST(subtotal AS DECIMAL(14,2)))
      FROM obra_costo oc
      WHERE oc.id_obra = o.id
        AND oc.id_proveedor = p.id
        AND oc.activo = 1
    ), 0) - ISNULL((
      SELECT SUM(CAST(monto AS DECIMAL(14,2)))
      FROM transacciones t
      INNER JOIN tipo_transaccion tt ON t.id_tipo_transaccion = tt.id
      WHERE t.id_obra = o.id
        AND tt.nombre = 'PAGO'
        AND t.tipo_asociado = 'PROVEEDOR'
        AND t.id_asociado = p.id
        AND t.activo = 1
    ), 0) AS saldo
  FROM proveedores p
  INNER JOIN obra_costo oc ON p.id = oc.id_proveedor AND oc.activo = 1
  INNER JOIN obras o ON oc.id_obra = o.id AND o.activo = 1 AND o.organizacion_id = @organizacion_id
  WHERE p.activo = 1
    AND p.organizacion_id = @organizacion_id
  ORDER BY p.nombre ASC, o.nombre ASC;
END;
GO
