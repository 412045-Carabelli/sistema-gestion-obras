-- V2__create_refresh_tokens_table.sql

CREATE TABLE refresh_tokens (
  id           BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  usuario_id   BIGINT NOT NULL REFERENCES usuarios(id),
  token        NVARCHAR(500) NOT NULL UNIQUE,
  expira_en    DATETIME2 NOT NULL,
  revocado     BIT NOT NULL DEFAULT 0,
  ip_origen    NVARCHAR(45) NULL,
  creado_en    DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_usuario ON refresh_tokens(usuario_id);
