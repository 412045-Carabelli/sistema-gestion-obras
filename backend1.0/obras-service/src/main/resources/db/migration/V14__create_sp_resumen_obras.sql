-- V14__create_sp_resumen_obras.sql
-- SPs para resumen de obras por cliente/proveedor (sin agrupación por grupo)

CREATE PROCEDURE sp_resumen_obras_clientes
AS
BEGIN
  SELECT
    c.id AS id_cliente,
    c.nombre AS nombre_cliente,
    o.id AS id_obra,
    o.nombre AS nombre_obra,
    ISNULL(o.presupuesto, 0) AS presupuestado,
    ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion IN (SELECT id FROM tipo_transaccion WHERE nombre = 'COBRO' AND activo = 1)
      THEN t.monto
      ELSE 0
    END), 0) AS cobros_realizados,
    ISNULL(o.presupuesto, 0) - ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion IN (SELECT id FROM tipo_transaccion WHERE nombre = 'COBRO' AND activo = 1)
      THEN t.monto
      ELSE 0
    END), 0) AS saldo
  FROM clientes c
  INNER JOIN obras o ON c.id = o.id_cliente AND o.activo = 1
  LEFT JOIN transacciones t ON o.id = t.id_obra
    AND t.tipo_asociado = 'CLIENTE'
    AND t.id_asociado = c.id
    AND t.activo = 1
  WHERE c.activo = 1
  GROUP BY c.id, c.nombre, o.id, o.nombre, o.presupuesto
  ORDER BY c.nombre ASC, o.nombre ASC;
END;

GO

CREATE PROCEDURE sp_resumen_obras_proveedores
AS
BEGIN
  SELECT
    p.id AS id_proveedor,
    p.nombre AS nombre_proveedor,
    o.id AS id_obra,
    o.nombre AS nombre_obra,
    ISNULL(SUM(CASE WHEN oc.activo = 1 THEN oc.subtotal ELSE 0 END), 0) AS costos,
    ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion IN (SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1)
      AND t.activo = 1
      THEN t.monto
      ELSE 0
    END), 0) AS pagos_realizados,
    ISNULL(SUM(CASE WHEN oc.activo = 1 THEN oc.subtotal ELSE 0 END), 0) - ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion IN (SELECT id FROM tipo_transaccion WHERE nombre = 'PAGO' AND activo = 1)
      AND t.activo = 1
      THEN t.monto
      ELSE 0
    END), 0) AS saldo
  FROM proveedores p
  INNER JOIN obra_costo oc ON p.id = oc.id_proveedor AND oc.activo = 1
  INNER JOIN obras o ON oc.id_obra = o.id AND o.activo = 1
  LEFT JOIN transacciones t ON o.id = t.id_obra
    AND t.tipo_asociado = 'PROVEEDOR'
    AND t.id_asociado = p.id
    AND t.activo = 1
  WHERE p.activo = 1
  GROUP BY p.id, p.nombre, o.id, o.nombre
  ORDER BY p.nombre ASC, o.nombre ASC;
END;
