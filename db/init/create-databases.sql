IF DB_ID('sgo_dev') IS NULL CREATE DATABASE sgo_dev;
GO
IF DB_ID('sgo_prod') IS NULL CREATE DATABASE sgo_prod;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'obras_app')
BEGIN
    CREATE LOGIN obras_app WITH PASSWORD = 'ObrasApp_2026!';
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'clientes_app')
BEGIN
    CREATE LOGIN clientes_app WITH PASSWORD = 'ClientesApp_2026!';
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'proveedores_app')
BEGIN
    CREATE LOGIN proveedores_app WITH PASSWORD = 'ProveedoresApp_2026!';
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'documentos_app')
BEGIN
    CREATE LOGIN documentos_app WITH PASSWORD = 'DocumentosApp_2026!';
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'transacciones_app')
BEGIN
    CREATE LOGIN transacciones_app WITH PASSWORD = 'TransaccionesApp_2026!';
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'reportes_app')
BEGIN
    CREATE LOGIN reportes_app WITH PASSWORD = 'ReportesApp_2026!';
END
GO

USE sgo_dev;
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'obras') EXEC('CREATE SCHEMA obras');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'clientes') EXEC('CREATE SCHEMA clientes');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'proveedores') EXEC('CREATE SCHEMA proveedores');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'documentos') EXEC('CREATE SCHEMA documentos');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'transacciones') EXEC('CREATE SCHEMA transacciones');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'reportes') EXEC('CREATE SCHEMA reportes');
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'obras_app')
BEGIN
    CREATE USER obras_app FOR LOGIN obras_app WITH DEFAULT_SCHEMA = obras;
    ALTER ROLE db_owner ADD MEMBER obras_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'clientes_app')
BEGIN
    CREATE USER clientes_app FOR LOGIN clientes_app WITH DEFAULT_SCHEMA = clientes;
    ALTER ROLE db_owner ADD MEMBER clientes_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'proveedores_app')
BEGIN
    CREATE USER proveedores_app FOR LOGIN proveedores_app WITH DEFAULT_SCHEMA = proveedores;
    ALTER ROLE db_owner ADD MEMBER proveedores_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'documentos_app')
BEGIN
    CREATE USER documentos_app FOR LOGIN documentos_app WITH DEFAULT_SCHEMA = documentos;
    ALTER ROLE db_owner ADD MEMBER documentos_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'transacciones_app')
BEGIN
    CREATE USER transacciones_app FOR LOGIN transacciones_app WITH DEFAULT_SCHEMA = transacciones;
    ALTER ROLE db_owner ADD MEMBER transacciones_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'reportes_app')
BEGIN
    CREATE USER reportes_app FOR LOGIN reportes_app WITH DEFAULT_SCHEMA = reportes;
    ALTER ROLE db_owner ADD MEMBER reportes_app;
END
GO

USE sgo_prod;
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'obras') EXEC('CREATE SCHEMA obras');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'clientes') EXEC('CREATE SCHEMA clientes');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'proveedores') EXEC('CREATE SCHEMA proveedores');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'documentos') EXEC('CREATE SCHEMA documentos');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'transacciones') EXEC('CREATE SCHEMA transacciones');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'reportes') EXEC('CREATE SCHEMA reportes');
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'obras_app')
BEGIN
    CREATE USER obras_app FOR LOGIN obras_app WITH DEFAULT_SCHEMA = obras;
    ALTER ROLE db_owner ADD MEMBER obras_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'clientes_app')
BEGIN
    CREATE USER clientes_app FOR LOGIN clientes_app WITH DEFAULT_SCHEMA = clientes;
    ALTER ROLE db_owner ADD MEMBER clientes_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'proveedores_app')
BEGIN
    CREATE USER proveedores_app FOR LOGIN proveedores_app WITH DEFAULT_SCHEMA = proveedores;
    ALTER ROLE db_owner ADD MEMBER proveedores_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'documentos_app')
BEGIN
    CREATE USER documentos_app FOR LOGIN documentos_app WITH DEFAULT_SCHEMA = documentos;
    ALTER ROLE db_owner ADD MEMBER documentos_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'transacciones_app')
BEGIN
    CREATE USER transacciones_app FOR LOGIN transacciones_app WITH DEFAULT_SCHEMA = transacciones;
    ALTER ROLE db_owner ADD MEMBER transacciones_app;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'reportes_app')
BEGIN
    CREATE USER reportes_app FOR LOGIN reportes_app WITH DEFAULT_SCHEMA = reportes;
    ALTER ROLE db_owner ADD MEMBER reportes_app;
END
GO
