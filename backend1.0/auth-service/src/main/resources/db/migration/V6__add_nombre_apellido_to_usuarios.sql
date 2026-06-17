-- V6: Agregar nombre y apellido a usuarios
ALTER TABLE usuarios ADD nombre    NVARCHAR(100) NULL;
GO
ALTER TABLE usuarios ADD apellido  NVARCHAR(100) NULL;
GO
