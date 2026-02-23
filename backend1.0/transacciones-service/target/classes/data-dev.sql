-- Transacciones base para DEV (relacionadas a obra/cliente/proveedor)
INSERT INTO transacciones (
    id, id_obra, tipo_asociado, id_asociado, id_tipo_transaccion,
    fecha, monto, forma_pago, medio_pago, factura_cobrada,
    activo, baja_obra, ultima_actualizacion, tipo_actualizacion
) VALUES
(
    1, 1, 'CLIENTE', 1, 'COBRO',
    CURRENT_DATE, 500000.00, 'Parcial', 'transferencia', TRUE,
    TRUE, FALSE, CURRENT_TIMESTAMP, 'CREATE'
),
(
    2, 1, 'PROVEEDOR', 1, 'PAGO',
    CURRENT_DATE, 250000.00, 'Parcial', 'transferencia', FALSE,
    TRUE, FALSE, CURRENT_TIMESTAMP, 'CREATE'
),
(
    3, 1, 'CLIENTE', 1, 'COBRO',
    CURRENT_DATE, 300000.00, 'Parcial', 'efectivo', TRUE,
    TRUE, FALSE, CURRENT_TIMESTAMP, 'CREATE'
);

INSERT INTO facturas (
    id, id_cliente, id_obra, monto, monto_restante, fecha, descripcion,
    estado, nombre_archivo, path_archivo, activo, impacta_cta_cte, id_transaccion,
    ultima_actualizacion, tipo_actualizacion
) VALUES (
    1,
    1,
    1,
    800000.00,
    0.00,
    CURRENT_DATE,
    'Factura anticipo obra San Martín',
    'COBRADA',
    'factura-001.pdf',
    '/dev/null',
    TRUE,
    TRUE,
    1,
    CURRENT_TIMESTAMP,
    'CREATE'
);

