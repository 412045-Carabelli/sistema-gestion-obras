-- V18__sp_transacciones_con_asociados_paginado.sql
-- SP que reemplaza los N+1 HTTP calls de listarConAsociadosPaginado.
-- Hace JOINs cross-DB con obras, clientes y proveedores en una sola query.

DROP PROCEDURE IF EXISTS sp_transacciones_con_asociados_paginado;
GO

CREATE PROCEDURE sp_transacciones_con_asociados_paginado
    @page        INT = 0,
    @size        INT = 50,
    @idObra      BIGINT = NULL,
    @tipoAsociado NVARCHAR(50) = NULL,
    @idAsociado  BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = @page * @size;

    -- Total de filas para paginación
    SELECT COUNT(1) AS totalElements
    FROM [sgo_transacciones].[dbo].[transacciones] t
    WHERE t.activo = 1
      AND (@idObra IS NULL OR t.id_obra = @idObra)
      AND (@tipoAsociado IS NULL OR t.tipo_asociado = @tipoAsociado)
      AND (@idAsociado IS NULL OR t.id_asociado = @idAsociado);

    -- Página de datos con JOINs cross-DB
    SELECT
        t.id,
        t.id_obra,
        o.nombre                                    AS nombre_obra,
        t.tipo_asociado,
        t.id_asociado,
        CASE
            WHEN t.tipo_asociado = 'CLIENTE'   THEN c.nombre
            WHEN t.tipo_asociado = 'PROVEEDOR' THEN p.nombre
            WHEN t.tipo_asociado = 'COMISION'  THEN N'Comisión'
            ELSE NULL
        END                                         AS nombre_asociado,
        t.id_tipo_transaccion,
        tt.nombre                                   AS tipo_transaccion,
        t.fecha,
        CAST(t.monto AS DECIMAL(14,2))              AS monto,
        t.forma_pago,
        t.medio_pago,
        t.concepto,
        t.factura_cobrada,
        t.activo,
        t.ultima_actualizacion,
        t.tipo_actualizacion
    FROM [sgo_transacciones].[dbo].[transacciones] t
    LEFT JOIN [sgo_transacciones].[dbo].[tipo_transaccion] tt
           ON CAST(t.id_tipo_transaccion AS BIGINT) = tt.id
    LEFT JOIN [sgo_obras].[dbo].[obras] o
           ON t.id_obra = o.id
    LEFT JOIN [sgo_clientes].[dbo].[clientes] c
           ON t.tipo_asociado = 'CLIENTE' AND t.id_asociado = c.id
    LEFT JOIN [sgo_proveedores].[dbo].[proveedores] p
           ON t.tipo_asociado = 'PROVEEDOR' AND t.id_asociado = p.id
    WHERE t.activo = 1
      AND (@idObra IS NULL OR t.id_obra = @idObra)
      AND (@tipoAsociado IS NULL OR t.tipo_asociado = @tipoAsociado)
      AND (@idAsociado IS NULL OR t.id_asociado = @idAsociado)
    ORDER BY t.fecha DESC, t.id DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;

END;
GO
