-- Tipo de transaccion + transacciones mock para DEV
DELETE FROM transacciones;
DELETE FROM tipo_transaccion;

INSERT INTO tipo_transaccion (id, nombre, activo)
VALUES (1, 'Cobro', 1), (2, 'Pago', 1);

INSERT INTO transacciones (id, id_obra, tipo_asociado, id_asociado, id_costo, id_tipo_transaccion, fecha, monto, forma_pago, medio_pago, factura_cobrada, activo)
VALUES
    (1, 1, 'CLIENTE', 1, NULL, 'COBRO', '2024-09-18 00:00:00', 350000.00, 'TOTAL', 'Transferencia', 1, 1),
    (2, 1, 'PROVEEDOR', 1, 1, 'PAGO', '2024-09-25 00:00:00', 180000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (3, 1, 'PROVEEDOR', 9, 2, 'PAGO', '2024-10-01 00:00:00', 90000.00, 'PARCIAL', 'Cheque', 0, 1),
    (4, 2, 'CLIENTE', 2, NULL, 'COBRO', '2024-10-10 00:00:00', 280000.00, 'TOTAL', 'Transferencia', 1, 1),
    (5, 2, 'PROVEEDOR', 2, 4, 'PAGO', '2024-11-05 00:00:00', 220000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (6, 2, 'PROVEEDOR', 5, 5, 'PAGO', '2024-11-12 00:00:00', 120000.00, 'PARCIAL', 'Efectivo', 0, 1),
    (7, 3, 'CLIENTE', 3, NULL, 'COBRO', '2024-11-15 00:00:00', 150000.00, 'TOTAL', 'Transferencia', 1, 1),
    (8, 3, 'PROVEEDOR', 7, 6, 'PAGO', '2024-11-22 00:00:00', 80000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (9, 4, 'CLIENTE', 8, NULL, 'COBRO', '2024-09-05 00:00:00', 450000.00, 'TOTAL', 'Transferencia', 1, 1),
    (10, 4, 'PROVEEDOR', 4, 7, 'PAGO', '2024-09-28 00:00:00', 320000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (11, 4, 'PROVEEDOR', 8, 8, 'PAGO', '2024-10-03 00:00:00', 90000.00, 'TOTAL', 'Cheque', 0, 1),
    (12, 5, 'CLIENTE', 10, NULL, 'COBRO', '2025-01-05 00:00:00', 300000.00, 'TOTAL', 'Transferencia', 1, 1),
    (13, 5, 'PROVEEDOR', 10, 9, 'PAGO', '2025-01-18 00:00:00', 150000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (14, 6, 'CLIENTE', 6, NULL, 'COBRO', '2024-12-15 00:00:00', 120000.00, 'TOTAL', 'Transferencia', 1, 1),
    (15, 6, 'PROVEEDOR', 11, 10, 'PAGO', '2024-12-28 00:00:00', 80000.00, 'PARCIAL', 'Transferencia', 0, 1),
    (16, 1, 'PROVEEDOR', 3, 3, 'PAGO', '2024-10-05 00:00:00', 81900.00, 'TOTAL', 'Transferencia', 0, 1);
