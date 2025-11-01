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
    ('Alquiler de Encofrados SA', 3, 'Lucía Torres', '3517654321', 'servicios@encofradossa.com', TRUE, CURRENT_TIMESTAMP),
    ('ElectroAndes SRL', 1, 'Leonardo Giménez', '3518765432', 'contacto@electroandes.com', TRUE, CURRENT_TIMESTAMP),
    ('Logística Andina Express', 3, 'Soledad Arce', '3517654987', 'operaciones@logisticaandina.com', TRUE, CURRENT_TIMESTAMP),
    ('Grúas del Litoral', 4, 'Marcelo Rivas', '3416547890', 'servicios@gruaslitoral.com', TRUE, CURRENT_TIMESTAMP),
    ('Servicios Sanitarios Integrales', 3, 'Elena Bustos', '3517458963', 'ventas@sanitariosintegrales.com', TRUE, CURRENT_TIMESTAMP),
    ('Vidrios Patagonia', 1, 'Federico Ocampo', '2994567890', 'contacto@vidriospatagonia.com', TRUE, CURRENT_TIMESTAMP),
    ('Pinturas Premium SRL', 1, 'Vanina Vega', '3518123456', 'info@pinturaspremium.com', TRUE, CURRENT_TIMESTAMP),
    ('Seguridad Industrial Cordobesa', 5, 'Diego Ferreyra', '3518456790', 'ventas@seguridadcordobesa.com', TRUE, CURRENT_TIMESTAMP),
    ('Techos y Estructuras del Centro', 2, 'Liliana Mores', '3518345670', 'administracion@techosyestructuras.com', TRUE, CURRENT_TIMESTAMP),
    ('HVAC Ingeniería Integral', 3, 'Gustavo Paredes', '3518234567', 'proyectos@hvacingenieria.com', TRUE, CURRENT_TIMESTAMP);
