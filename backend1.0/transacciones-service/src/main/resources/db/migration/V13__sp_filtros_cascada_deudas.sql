-- V13__sp_filtros_cascada_deudas.sql
-- SPs para filtros en cascada: cliente → obras/proveedores, proveedor → obras/clientes, obra → clientes/proveedores

-- Obtener OBRAS donde participa un CLIENTE (con filtros opcionales por proveedor u obra)
CREATE OR ALTER PROCEDURE sp_obtener_obras_por_cliente
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL,
  @obraId      BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    o.id,
    o.nombre,
    o.estado_obra AS estado
  FROM [sgo_obras].[dbo].[obras] o
  LEFT JOIN [sgo_obras].[dbo].[obra_costo] oc ON o.id = oc.id_obra AND oc.activo = 1
  WHERE o.activo = 1
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND (@obraId IS NULL OR o.id = @obraId)
  ORDER BY o.nombre;
END;
GO

-- Obtener PROVEEDORES que aparecen en las OBRAS de un CLIENTE (con filtros opcionales)
CREATE OR ALTER PROCEDURE sp_obtener_proveedores_por_cliente
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL,
  @obraId      BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    p.id,
    p.nombre
  FROM [sgo_proveedores].[dbo].[proveedores] p
  INNER JOIN [sgo_obras].[dbo].[obra_costo] oc ON p.id = oc.id_proveedor
  INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
  WHERE oc.activo = 1
    AND o.activo = 1
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@proveedorId IS NULL OR p.id = @proveedorId)
    AND (@obraId IS NULL OR oc.id_obra = @obraId)
  ORDER BY p.nombre;
END;
GO

-- Obtener OBRAS donde participa un PROVEEDOR (con filtros opcionales)
CREATE OR ALTER PROCEDURE sp_obtener_obras_por_proveedor
  @proveedorId BIGINT = NULL,
  @clienteId   BIGINT = NULL,
  @obraId      BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    o.id,
    o.nombre,
    o.estado_obra AS estado,
    o.id_cliente AS clienteId,
    c.nombre AS clienteNombre
  FROM [sgo_obras].[dbo].[obras] o
  INNER JOIN [sgo_obras].[dbo].[obra_costo] oc ON o.id = oc.id_obra
  LEFT JOIN [sgo_clientes].[dbo].[clientes] c ON o.id_cliente = c.id
  WHERE oc.activo = 1
    AND o.activo = 1
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@obraId IS NULL OR o.id = @obraId)
  ORDER BY o.nombre;
END;
GO

-- Obtener CLIENTES que aparecen en las OBRAS donde participa un PROVEEDOR (con filtros opcionales)
CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_proveedor
  @proveedorId BIGINT = NULL,
  @clienteId   BIGINT = NULL,
  @obraId      BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    c.id,
    c.nombre
  FROM [sgo_clientes].[dbo].[clientes] c
  INNER JOIN [sgo_obras].[dbo].[obras] o ON c.id = o.id_cliente
  INNER JOIN [sgo_obras].[dbo].[obra_costo] oc ON o.id = oc.id_obra
  WHERE oc.activo = 1
    AND o.activo = 1
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
    AND (@clienteId IS NULL OR c.id = @clienteId)
    AND (@obraId IS NULL OR o.id = @obraId)
  ORDER BY c.nombre;
END;
GO

-- Obtener PROVEEDORES de una OBRA específica (con filtros opcionales)
CREATE OR ALTER PROCEDURE sp_obtener_proveedores_por_obra
  @obraId      BIGINT = NULL,
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    p.id,
    p.nombre
  FROM [sgo_proveedores].[dbo].[proveedores] p
  INNER JOIN [sgo_obras].[dbo].[obra_costo] oc ON p.id = oc.id_proveedor
  INNER JOIN [sgo_obras].[dbo].[obras] o ON oc.id_obra = o.id
  WHERE oc.activo = 1
    AND o.activo = 1
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@clienteId IS NULL OR o.id_cliente = @clienteId)
    AND (@proveedorId IS NULL OR p.id = @proveedorId)
  ORDER BY p.nombre;
END;
GO

-- Obtener CLIENTES de una OBRA específica (con filtros opcionales)
CREATE OR ALTER PROCEDURE sp_obtener_clientes_por_obra
  @obraId      BIGINT = NULL,
  @clienteId   BIGINT = NULL,
  @proveedorId BIGINT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT DISTINCT
    c.id,
    c.nombre
  FROM [sgo_clientes].[dbo].[clientes] c
  INNER JOIN [sgo_obras].[dbo].[obras] o ON c.id = o.id_cliente
  LEFT JOIN [sgo_obras].[dbo].[obra_costo] oc ON o.id = oc.id_obra AND oc.activo = 1
  WHERE o.activo = 1
    AND (@obraId IS NULL OR o.id = @obraId)
    AND (@clienteId IS NULL OR c.id = @clienteId)
    AND (@proveedorId IS NULL OR oc.id_proveedor = @proveedorId)
  ORDER BY c.nombre;
END;
GO
