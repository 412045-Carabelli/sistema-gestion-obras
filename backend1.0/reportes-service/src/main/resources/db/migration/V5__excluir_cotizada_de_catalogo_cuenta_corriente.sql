-- V5__excluir_cotizada_de_catalogo_cuenta_corriente.sql
-- Una obra COTIZADA es una cotizacion enviada pero no confirmada por el
-- cliente: no debe aparecer como opcion de filtro en cuentas corrientes.
-- V4 la habia incluido por error junto con ADJUDICADA/EN_PROGRESO/FINALIZADA
-- para alinear este SP con los de transacciones-service; ahora se corrige
-- en ambos servicios (ver transacciones-service V35).

CREATE OR ALTER PROCEDURE sp_catalogos_cuenta_corriente
AS
BEGIN
    SET NOCOUNT ON;

    -- Obras activas con estado válido (ADJUDICADA, EN_PROGRESO, FINALIZADA)
    SELECT
        id,
        nombre
    FROM [sgo_obras].[dbo].[obras]
    WHERE activo = 1
      AND estado_obra IN ('ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA')
    ORDER BY nombre;

    -- Clientes activos
    SELECT
        id,
        nombre
    FROM [sgo_clientes].[dbo].[clientes]
    WHERE activo = 1
    ORDER BY nombre;

    -- Proveedores activos
    SELECT
        id,
        nombre
    FROM [sgo_proveedores].[dbo].[proveedores]
    WHERE activo = 1
    ORDER BY nombre;
END;
