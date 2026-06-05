-- V16__sp_dashboard_top_obras_financiero.sql
-- SP que devuelve top N obras por volumen financiero (cobros + pagos)
-- Usa cross-db join a sgo_obras para obtener nombre y presupuesto

IF OBJECT_ID('sp_dashboard_top_obras_financiero', 'P') IS NOT NULL
    DROP PROCEDURE sp_dashboard_top_obras_financiero;
GO

CREATE PROCEDURE sp_dashboard_top_obras_financiero
  @topN INT = 5
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP (@topN)
    o.id                                                               AS obra_id,
    o.nombre                                                           AS obra_nombre,
    CAST(ISNULL(o.presupuesto, 0) AS DECIMAL(14,2))                   AS presupuesto,
    CAST(ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion = 'COBRO' THEN CAST(t.monto AS DECIMAL(14,2))
      ELSE 0
    END), 0) AS DECIMAL(14,2))                                         AS total_cobros,
    CAST(ISNULL(SUM(CASE
      WHEN t.id_tipo_transaccion = 'PAGO' THEN CAST(t.monto AS DECIMAL(14,2))
      ELSE 0
    END), 0) AS DECIMAL(14,2))                                         AS total_pagos
  FROM [sgo_obras].[dbo].[obras] o
  LEFT JOIN transacciones t ON t.id_obra = o.id AND t.activo = 1
  WHERE o.activo = 1
    AND o.estado_obra NOT IN ('PERDIDA', 'CANCELADA')
  GROUP BY o.id, o.nombre, o.presupuesto
  ORDER BY (
    ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'COBRO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) +
    ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'PAGO'  THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0)
  ) DESC;
END;
GO
