-- V44__fix_sp_transacciones_tipo_transaccion_null.sql
--
-- transacciones.id_tipo_transaccion es VARCHAR(50) y guarda directamente el
-- string del enum ("COBRO"/"PAGO", ver Transaccion.java @Enumerated(STRING)),
-- no un FK numerico a tipo_transaccion.id. El SP intentaba resolverlo con
-- TRY_CAST(t.id_tipo_transaccion AS BIGINT) = tt.id, que siempre falla (no es
-- numerico) -> tt.nombre queda NULL en todas las filas -> columna "Tipo
-- Transaccion" vacia en el frontend (movimientos-list).
--
-- Fix: quitar el JOIN inutil y devolver t.id_tipo_transaccion directamente
-- como tipo_transaccion.

CREATE OR ALTER PROCEDURE sp_transacciones_con_asociados_paginado
    @page            INT            = 0,
    @size            INT            = 50,
    @idObra          BIGINT         = NULL,
    @tipoAsociado    NVARCHAR(50)   = NULL,
    @idAsociado      BIGINT         = NULL,
    @organizacion_id BIGINT         = NULL,
    @fechaInicio     DATE           = NULL,
    @fechaFin        DATE           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @offset INT = @page * @size;

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
        t.id_tipo_transaccion                       AS tipo_transaccion,
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
      AND (@organizacion_id IS NULL OR t.organizacion_id = @organizacion_id)
      AND (@fechaInicio IS NULL OR CAST(t.fecha AS DATE) >= @fechaInicio)
      AND (@fechaFin IS NULL OR CAST(t.fecha AS DATE) <= @fechaFin)
    ORDER BY t.fecha DESC, t.id DESC
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;

END;
GO
