-- SP para obtener catálogos de filtros de cuentas corrientes
-- Devuelve obras, clientes y proveedores activos en una sola llamada

CREATE PROCEDURE sp_catalogos_cuenta_corriente
AS
BEGIN
    SET NOCOUNT ON;

    -- Obras activas con estado válido (ADJUDICADA, EN_PROGRESO, FINALIZADA)
    SELECT
        id,
        nombre
    FROM [sgo_obras].[dbo].[obras]
    WHERE activo = 1
      AND obra_estado IN ('ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA')
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
