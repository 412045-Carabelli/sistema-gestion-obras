-- Agregar columna id_grupo a tabla obras
-- Permite asociar cada obra a un grupo para reportes agrupados

ALTER TABLE obras ADD id_grupo BIGINT NULL;

-- Crear índice para consultas
CREATE INDEX idx_obras_id_grupo ON obras(id_grupo);

-- Crear foreign key (opcional, comentado para no romper integridad al inicio)
-- ALTER TABLE obras ADD CONSTRAINT fk_obras_id_grupo FOREIGN KEY (id_grupo) REFERENCES grupos_obras(id);
