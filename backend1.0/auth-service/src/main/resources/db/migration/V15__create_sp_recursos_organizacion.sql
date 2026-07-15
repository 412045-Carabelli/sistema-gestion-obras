-- SP que cuenta recursos por organización usando cross-DB queries.
-- Wraps CREATE OR ALTER en sp_executesql para diferir la resolución de columnas
-- de otras BDs al runtime (evita error de parse-time si las BDs aún no existen).
-- Los nombres de cada base se reciben como parámetro (default = nombre de
-- produccion) porque en dev cada servicio usa su propia base con sufijo _test
-- (sgo_obras_test, sgo_clientes_test, etc.) — hardcodear el nombre de
-- produccion haria que este SP siempre lea la base equivocada en dev.
DECLARE @sql NVARCHAR(MAX) = N'CREATE OR ALTER PROCEDURE sp_recursos_organizacion
  @organizacion_id     BIGINT,
  @schemaObras         NVARCHAR(128) = ''sgo_obras'',
  @schemaClientes      NVARCHAR(128) = ''sgo_clientes'',
  @schemaProveedores   NVARCHAR(128) = ''sgo_proveedores'',
  @schemaTransacciones NVARCHAR(128) = ''sgo_transacciones''
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @obras_activas      INT = 0;
  DECLARE @clientes           INT = 0;
  DECLARE @proveedores        INT = 0;
  DECLARE @transacciones_mes  INT = 0;
  DECLARE @innerSql NVARCHAR(MAX);

  SET @innerSql = N''SELECT @obras_activas_out = COUNT(*)
    FROM '' + QUOTENAME(@schemaObras) + N''.[dbo].[obras]
    WHERE activo = 1 AND organizacion_id = @organizacion_id_in'';
  EXEC sp_executesql @innerSql,
    N''@organizacion_id_in BIGINT, @obras_activas_out INT OUTPUT'',
    @organizacion_id_in = @organizacion_id, @obras_activas_out = @obras_activas OUTPUT;

  SET @innerSql = N''SELECT @clientes_out = COUNT(*)
    FROM '' + QUOTENAME(@schemaClientes) + N''.[dbo].[clientes]
    WHERE activo = 1 AND organizacion_id = @organizacion_id_in'';
  EXEC sp_executesql @innerSql,
    N''@organizacion_id_in BIGINT, @clientes_out INT OUTPUT'',
    @organizacion_id_in = @organizacion_id, @clientes_out = @clientes OUTPUT;

  SET @innerSql = N''SELECT @proveedores_out = COUNT(*)
    FROM '' + QUOTENAME(@schemaProveedores) + N''.[dbo].[proveedores]
    WHERE activo = 1 AND organizacion_id = @organizacion_id_in'';
  EXEC sp_executesql @innerSql,
    N''@organizacion_id_in BIGINT, @proveedores_out INT OUTPUT'',
    @organizacion_id_in = @organizacion_id, @proveedores_out = @proveedores OUTPUT;

  SET @innerSql = N''SELECT @transacciones_mes_out = COUNT(*)
    FROM '' + QUOTENAME(@schemaTransacciones) + N''.[dbo].[transacciones]
    WHERE activo = 1 AND organizacion_id = @organizacion_id_in
      AND YEAR(fecha) = YEAR(GETDATE()) AND MONTH(fecha) = MONTH(GETDATE())'';
  EXEC sp_executesql @innerSql,
    N''@organizacion_id_in BIGINT, @transacciones_mes_out INT OUTPUT'',
    @organizacion_id_in = @organizacion_id, @transacciones_mes_out = @transacciones_mes OUTPUT;

  SELECT
    @obras_activas     AS obras_activas,
    @clientes          AS clientes,
    @proveedores       AS proveedores,
    @transacciones_mes AS transacciones_mes;
END';
EXEC sp_executesql @sql;
GO
