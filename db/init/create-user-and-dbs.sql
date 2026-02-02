IF DB_ID('sistema_gestion_obras') IS NULL CREATE DATABASE sistema_gestion_obras;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'sgo_pablo_pezzini')
BEGIN
  CREATE LOGIN sgo_pablo_pezzini WITH PASSWORD = 'Sistema_obras1!';
END
GO
USE sistema_gestion_obras;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sgo_pablo_pezzini')
BEGIN
  CREATE USER sgo_pablo_pezzini FOR LOGIN sgo_pablo_pezzini;
  EXEC sp_addrolemember 'db_owner', 'sgo_pablo_pezzini';
END
GO
j