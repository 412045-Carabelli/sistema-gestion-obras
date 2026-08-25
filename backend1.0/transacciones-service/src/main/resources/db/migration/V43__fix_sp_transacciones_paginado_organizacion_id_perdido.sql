-- V43__fix_sp_transacciones_paginado_organizacion_id_perdido.sql
--
-- V40 reescribio este SP a partir del texto viejo de V18 (antes de V28) para
-- agregarle el filtro de fecha, y sin querer se llevo puesto el parametro
-- @organizacion_id que V28 ya habia agregado. Resultado: la firma quedo en 7
-- parametros (page,size,idObra,tipoAsociado,idAsociado,fechaInicio,fechaFin)
-- mientras el codigo Java (TransaccionConAsociadoRepository) sigue registrando
-- 8 posicionales con @organizacion_id en la posicion 6 -> "too many arguments
-- specified" en cada llamada.
--
-- Fix: restaurar @organizacion_id (misma posicion que V28) y dejar las fechas
-- al final, orden = page,size,idObra,tipoAsociado,idAsociado,organizacion_id,
-- fechaInicio,fechaFin - exactamente lo que registra el Java.

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
           ON TRY_CAST(t.id_tipo_transaccion AS BIGINT) = tt.id
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
