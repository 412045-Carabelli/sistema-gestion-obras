-- Tipo de transaccion + transacciones de ejemplo coherentes
DELETE FROM transacciones;
DELETE FROM tipo_transaccion;

INSERT INTO tipo_transaccion (id, nombre, activo)
VALUES (1, 'Cobro', 1), (2, 'Pago', 1);

INSERT INTO transacciones (id, id_obra, tipo_asociado, id_asociado, id_costo, id_tipo_transaccion, fecha, monto, forma_pago, medio_pago, factura_cobrada, activo)
VALUES
    (1, 1, 'CLIENTE', 1, NULL, 'COBRO', '2025-02-05 00:00:00', 300000.00, 'TOTAL', 'Transferencia', 1, 1),
    (2, 1, 'PROVEEDOR', 1, 1, 'PAGO', '2025-02-12 00:00:00', 180000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (3, 1, 'PROVEEDOR', 2, 2, 'PAGO', '2025-02-15 00:00:00', 150000.00, 'TOTAL', 'Transferencia', 0, 1),
    (4, 2, 'CLIENTE', 2, NULL, 'COBRO', '2025-03-10 00:00:00', 350000.00, 'TOTAL', 'Transferencia', 1, 1),
    (5, 2, 'PROVEEDOR', 3, 3, 'PAGO', '2025-03-18 00:00:00', 200000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (6, 3, 'CLIENTE', 3, NULL, 'COBRO', '2025-04-02 00:00:00', 120000.00, 'TOTAL', 'Transferencia', 1, 1),
    (7, 3, 'PROVEEDOR', 2, 5, 'PAGO', '2025-04-08 00:00:00', 70000.00, 'TOTAL', 'Transferencia', 0, 1);
