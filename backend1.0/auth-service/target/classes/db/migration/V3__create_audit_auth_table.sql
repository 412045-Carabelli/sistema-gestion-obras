-- V3__create_audit_auth_table.sql

CREATE TABLE audit_auth (
  id           BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  usuario_id   BIGINT NULL,
  email        NVARCHAR(255) NOT NULL,
  accion       NVARCHAR(50) NOT NULL,
  ip           NVARCHAR(45) NOT NULL,
  user_agent   NVARCHAR(500) NULL,
  detalle      NVARCHAR(500) NULL,
  created_at   DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_audit_auth_usuario ON audit_auth(usuario_id);
CREATE INDEX idx_audit_auth_email ON audit_auth(email);
