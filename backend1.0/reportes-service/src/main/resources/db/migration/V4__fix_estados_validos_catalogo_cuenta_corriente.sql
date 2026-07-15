-- Alinea sp_catalogos_cuenta_corriente con el mismo criterio de estado que
-- sp_deudas_globales_con_grupo / sp_deudas_proveedores_con_grupo y los SPs de
-- filtros en cascada (transacciones-service V31): COTIZADA, ADJUDICADA,
-- EN_PROGRESO, FINALIZADA. Antes faltaba COTIZADA, por eso el filtro de
-- Obra(s) sin cliente/proveedor seleccionado traia menos obras validas que
-- el resto de los filtros en cascada.

CREATE OR ALTER PROCEDURE sp_catalogos_cuenta_corriente
AS
BEGIN
    SET NOCOUNT ON;

    -- Obras activas con estado válido (COTIZADA, ADJUDICADA, EN_PROGRESO, FINALIZADA)
    SELECT
        id,
        nombre
    FROM [sgo_obras].[dbo].[obras]
    WHERE activo = 1
      AND estado_obra IN ('COTIZADA', 'ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA')
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
