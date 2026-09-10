-- V18__create_usuario_aplicacion_table.sql
-- Que apps del ecosistema puede usar cada usuario. Independiente de la organizacion: un
-- usuario puede tener acceso a Frezco sin importar en que org este.

CREATE TABLE aplicacion (
  id      NVARCHAR(20) NOT NULL PRIMARY KEY,
  nombre  NVARCHAR(100) NOT NULL,
  activo  BIT NOT NULL DEFAULT 1
);

INSERT INTO aplicacion (id, nombre, activo) VALUES
  ('SGO', 'Sistema de Gestion de Obras', 1),
  ('FREZCO', 'FrezCo', 1),
  ('BUILDR_SUPP', 'Buildr Supp', 1);

CREATE TABLE usuario_aplicacion (
  usuario_id  BIGINT NOT NULL REFERENCES usuarios(id),
  aplicacion  NVARCHAR(20) NOT NULL REFERENCES aplicacion(id),
  activo      BIT NOT NULL DEFAULT 1,
  PRIMARY KEY (usuario_id, aplicacion)
);

CREATE INDEX idx_usuario_aplicacion_usuario ON usuario_aplicacion(usuario_id);

-- Hasta ahora el unico app que corria era SGO: se preserva el acceso de los usuarios
-- existentes. Frezco y Buildr Supp no se otorgan automaticamente, se asignan a mano.
INSERT INTO usuario_aplicacion (usuario_id, aplicacion, activo)
SELECT id, 'SGO', 1 FROM usuarios;
