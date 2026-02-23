-- Obra base para DEV (relacionada a cliente y proveedor)
INSERT INTO obras (
    id, id_cliente, estado_obra, nombre, direccion, fecha_presupuesto, fecha_inicio,
    presupuesto, beneficio_global, requiere_factura, activo, creado_en, notas,
    ultima_actualizacion, tipo_actualizacion
) VALUES (
    1,
    1,
    'EN_PROGRESO',
    'Ampliación Edificio San Martín',
    'San Martín 850, Córdoba',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    15000000.00,
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    'Proyecto en fase de obra gruesa.',
    CURRENT_TIMESTAMP,
    'CREATE'
);

INSERT INTO obra_costo (
    id, id_proveedor, precio_unitario, id_estado_pago, id_obra, tipo_costo,
    item_numero, descripcion, unidad, cantidad, beneficio, subtotal, total,
    activo, baja_obra, ultima_actualizacion, tipo_actualizacion
) VALUES (
    1,
    1,
    125000.00,
    'PARCIAL',
    1,
    'ORIGINAL',
    'MAT-001',
    'Ladrillo hueco 18x18x33',
    'unidad',
    600.000,
    0.00,
    750000.00,
    750000.00,
    TRUE,
    FALSE,
    CURRENT_TIMESTAMP,
    'CREATE'
);

