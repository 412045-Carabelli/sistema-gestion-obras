-- V4__create_organizaciones_table.sql -- preparado para futuro multi-tenancy

CREATE TABLE organizaciones (
  id       BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  nombre   NVARCHAR(255) NOT NULL,
  activo   BIT NOT NULL DEFAULT 1,
  creado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE usuario_organizacion (
  usuario_id       BIGINT NOT NULL REFERENCES usuarios(id),
  organizacion_id  BIGINT NOT NULL REFERENCES organizaciones(id),
  rol              NVARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  activo           BIT NOT NULL DEFAULT 1,
  PRIMARY KEY (usuario_id, organizacion_id)
);

CREATE INDEX idx_usuario_organizacion_usuario ON usuario_organizacion(usuario_id);
CREATE INDEX idx_usuario_organizacion_org ON usuario_organizacion(organizacion_id);
