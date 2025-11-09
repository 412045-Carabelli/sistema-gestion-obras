-- Tipo de transacción (auxiliar) + transacciones mock para DEV
INSERT OR IGNORE INTO tipo_transaccion (id, nombre) VALUES (1, 'Cobro'), (2, 'Pago');

INSERT INTO transacciones
(id_obra, tipo_asociado, id_asociado, id_tipo_transaccion, fecha, monto, forma_pago, activo)
VALUES
    (1, 'CLIENTE', 1, 1, '2025-10-10 00:00:00', 150000.00, 'Parcial', 1),
    (1, 'PROVEEDOR', 2, 2, '2025-10-11 00:00:00', 85000.00, 'Total', 1),
    (1, 'PROVEEDOR', 5, 2, '2025-10-20 00:00:00', 45000.00, 'Transferencia', 1),
    (2, 'CLIENTE', 2, 1, '2025-10-15 00:00:00', 98000.00, 'Transferencia', 1),
    (2, 'PROVEEDOR', 3, 2, '2025-10-16 00:00:00', 45000.00, 'Cheque', 1),
    (3, 'CLIENTE', 3, 1, '2025-11-01 00:00:00', 210000.00, 'Transferencia', 1),
    (3, 'PROVEEDOR', 6, 2, '2025-11-05 00:00:00', 125000.00, 'Transferencia', 1),
    (3, 'PROVEEDOR', 11, 2, '2025-11-08 00:00:00', 64000.00, 'Efectivo', 1),
    (4, 'CLIENTE', 5, 1, '2025-11-12 00:00:00', 325000.00, 'Efectivo', 1),
    (4, 'PROVEEDOR', 8, 2, '2025-11-14 00:00:00', 95000.00, 'Transferencia', 1),
    (4, 'PROVEEDOR', 12, 2, '2025-11-18 00:00:00', 18500.00, 'Transferencia', 1),
    (5, 'CLIENTE', 6, 1, '2025-12-01 00:00:00', 550000.00, 'Transferencia', 1),
    (5, 'PROVEEDOR', 9, 2, '2025-12-03 00:00:00', 230000.00, 'Transferencia', 1),
    (5, 'PROVEEDOR', 14, 2, '2025-12-07 00:00:00', 180000.00, 'Cheque diferido', 1),
    (6, 'CLIENTE', 7, 1, '2026-01-05 00:00:00', 125000.00, 'Cheque diferido', 1),
    (6, 'PROVEEDOR', 10, 2, '2026-01-07 00:00:00', 78000.00, 'Transferencia', 1),
    (6, 'PROVEEDOR', 7, 2, '2026-01-09 00:00:00', 42000.00, 'Transferencia', 1);
