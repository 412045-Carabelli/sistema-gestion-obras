-- V1__create_usuarios_table.sql

CREATE TABLE usuarios (
  id              BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  email           NVARCHAR(255) NOT NULL UNIQUE,
  username        NVARCHAR(100) NOT NULL UNIQUE,
  password_hash   NVARCHAR(255) NOT NULL,
  rol             NVARCHAR(50) NOT NULL DEFAULT 'USER',
  activo          BIT NOT NULL DEFAULT 1,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME2 NULL,
  creado_en       DATETIME2 NOT NULL DEFAULT GETDATE(),
  ultima_actualizacion DATETIME2 NULL
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_username ON usuarios(username);
