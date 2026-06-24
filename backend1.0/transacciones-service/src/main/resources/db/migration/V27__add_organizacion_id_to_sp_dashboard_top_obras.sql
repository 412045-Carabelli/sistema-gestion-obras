-- V27__add_organizacion_id_to_sp_dashboard_top_obras.sql
-- Agrega filtro de organizacion_id a sp_dashboard_top_obras_financiero.
-- Antes: retornaba top obras de TODAS las organizaciones.
-- Ahora: filtra por @organizacion_id cuando se especifica.

CREATE OR ALTER PROCEDURE sp_dashboard_top_obras_financiero
  @topN            INT    = 5,
  @organizacion_id BIGINT = NULL
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
    AND (@organizacion_id IS NULL OR o.organizacion_id = @organizacion_id)
  GROUP BY o.id, o.nombre, o.presupuesto
  ORDER BY (
    ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'COBRO' THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0) +
    ISNULL(SUM(CASE WHEN t.id_tipo_transaccion = 'PAGO'  THEN CAST(t.monto AS DECIMAL(14,2)) ELSE 0 END), 0)
  ) DESC;
END;
GO
