-- Multi-producto: qué aplicación (SGO, FRESCO, BUILDRR_FEEDBACK) es dueña de
-- cada documento, y a qué organización pertenece (solo tiene sentido para
-- productos multi-org como SGO — nullable, FrezCo/tiquetera no lo usan).
-- Default 'SGO' porque el frontend de SGO nunca manda este campo hoy.
ALTER TABLE documentos ADD producto NVARCHAR(20) NOT NULL CONSTRAINT DF_documentos_producto DEFAULT 'SGO';
ALTER TABLE documentos ADD organizacion_id BIGINT NULL;

CREATE INDEX idx_documentos_producto ON documentos(producto);
