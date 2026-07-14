-- SP que cuenta recursos por organización usando cross-DB queries.
-- Wraps CREATE OR ALTER en sp_executesql para diferir la resolución de columnas
-- de otras BDs al runtime (evita error de parse-time si las BDs aún no existen).
DECLARE @sql NVARCHAR(MAX) = N'CREATE OR ALTER PROCEDURE sp_recursos_organizacion
  @organizacion_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @obras_activas      INT = 0;
  DECLARE @clientes           INT = 0;
  DECLARE @proveedores        INT = 0;
  DECLARE @transacciones_mes  INT = 0;

  SELECT @obras_activas = COUNT(*)
  FROM [sgo_obras].[dbo].[obras]
  WHERE activo = 1
    AND organizacion_id = @organizacion_id;

  SELECT @clientes = COUNT(*)
  FROM [sgo_clientes].[dbo].[clientes]
  WHERE activo = 1
    AND organizacion_id = @organizacion_id;

  SELECT @proveedores = COUNT(*)
  FROM [sgo_proveedores].[dbo].[proveedores]
  WHERE activo = 1
    AND organizacion_id = @organizacion_id;

  SELECT @transacciones_mes = COUNT(*)
  FROM [sgo_transacciones].[dbo].[transacciones]
  WHERE activo = 1
    AND organizacion_id = @organizacion_id
    AND YEAR(fecha) = YEAR(GETDATE())
    AND MONTH(fecha) = MONTH(GETDATE());

  SELECT
    @obras_activas     AS obras_activas,
    @clientes          AS clientes,
    @proveedores       AS proveedores,
    @transacciones_mes AS transacciones_mes;
END';
EXEC sp_executesql @sql;
GO
