-- Proveedor base para DEV (coherente con obra y transacciones)
INSERT INTO tipo_proveedor (id, nombre, activo, ultima_actualizacion, tipo_actualizacion)
VALUES (1, 'Contratista', TRUE, CURRENT_TIMESTAMP, 'CREATE');

INSERT INTO gremios (id, nombre, activo, ultima_actualizacion, tipo_actualizacion)
VALUES (1, 'Albañilería', TRUE, CURRENT_TIMESTAMP, 'CREATE');

INSERT INTO proveedores (
    id, nombre, tipo_proveedor_id, gremio_id, dni_cuit, contacto, telefono,
    email, direccion, activo, creado_en, ultima_actualizacion, tipo_actualizacion
) VALUES (
    1,
    'Materiales Córdoba SRL',
    1,
    1,
    '30-87654321-9',
    'Lucía Paredes',
    '3519876543',
    'lucia.paredes@materialescba.com',
    'Ruta 9 Km 695, Córdoba',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'CREATE'
);

INSERT INTO movimientos (
    id, proveedor_id, obra_id, descripcion, monto, monto_pagado, pagado, creado_en
) VALUES (
    1,
    1,
    1,
    'Anticipo de materiales para obra',
    750000.00,
    250000.00,
    FALSE,
    CURRENT_TIMESTAMP
);

