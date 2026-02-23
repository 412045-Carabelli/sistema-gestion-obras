-- Cliente base para DEV (coherente con obra y transacciones)
INSERT INTO clientes (
    id, nombre, id_empresa, contacto, cuit, telefono, email, direccion,
    condicion_iva, activo, creado_en, ultima_actualizacion, tipo_actualizacion
) VALUES (
    1,
    'Constructora San Jorge',
    1,
    'Juan Perez',
    '30-12345678-9',
    '3511234567',
    'juan.perez@sanjorge.com',
    'Av. Colón 1234, Córdoba',
    'RESPONSABLE_INSCRIPTO',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'CREATE'
);
