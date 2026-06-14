IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_clientes')
    CREATE DATABASE sgo_clientes;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_obras')
    CREATE DATABASE sgo_obras;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_proveedores')
    CREATE DATABASE sgo_proveedores;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_reportes')
    CREATE DATABASE sgo_reportes;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_transacciones')
    CREATE DATABASE sgo_transacciones;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_documentos')
    CREATE DATABASE sgo_documentos;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_agendas')
    CREATE DATABASE sgo_agendas;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sgo_auth')
    CREATE DATABASE sgo_auth;
GO
