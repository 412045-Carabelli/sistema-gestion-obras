-- Solo tablas auxiliares para PROD (docker)
INSERT OR IGNORE INTO tipo_proveedor (nombre, activo) VALUES
    ('Materiales', TRUE),
    ('Mano de Obra', TRUE),
    ('Servicios', TRUE),
    ('Equipos / Maquinaria', TRUE),
    ('Otros', TRUE);


