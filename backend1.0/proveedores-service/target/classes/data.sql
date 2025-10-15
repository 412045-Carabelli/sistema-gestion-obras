-- Tipos de proveedor
INSERT INTO tipo_proveedor (nombre, activo) VALUES
    ('Materiales', TRUE),
    ('Mano de Obra', TRUE),
    ('Servicios', TRUE),
    ('Equipos / Maquinaria', TRUE),
    ('Otros', TRUE);

INSERT INTO proveedores (nombre, id_tipo_proveedor, contacto, telefono, email, activo, creado_en) VALUES
    ('Hormigones Córdoba S.A.', 1, 'Juan Pérez', '3511234567', 'ventas@hormigonescordoba.com', TRUE, CURRENT_TIMESTAMP),
    ('Hierros del Centro SRL', 1, 'María Gómez', '3519876543', 'info@hierroscentro.com', TRUE, CURRENT_TIMESTAMP),
    ('Cerámica San José', 1, 'Carlos Ramírez', '3514567890', 'contacto@ceramicasanjose.com', TRUE, CURRENT_TIMESTAMP),
    ('Albañiles Hermanos López', 2, 'Pedro López', '3516543210', 'lopez@albaniles.com', TRUE, CURRENT_TIMESTAMP),
    ('Alquiler de Encofrados SA', 3, 'Lucía Torres', '3517654321', 'servicios@encofradossa.com', TRUE, CURRENT_TIMESTAMP);
