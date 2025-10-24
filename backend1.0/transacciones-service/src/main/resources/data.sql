INSERT INTO tipo_transaccion (id, nombre) VALUES (1, 'Cobro'), (2, 'Pago');

INSERT INTO transacciones
(id_obra, tipo_asociado, id_asociado, id_tipo_transaccion, fecha, monto, forma_pago, activo)
VALUES
    (1, 'CLIENTE', 1, 1, '2025-10-10 00:00:00', 150000.00, 'Parcial', 1),
    (1, 'PROVEEDOR', 2, 2, '2025-10-11 00:00:00', 85000.00, 'Total', 1);
