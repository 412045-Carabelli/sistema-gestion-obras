INSERT INTO tipo_transaccion (nombre) VALUES
('Cobro'),
('Pago');

INSERT INTO transacciones
(id_obra, id_tipo_transaccion, fecha, monto, forma_pago, activo)
VALUES
(1, 1, '2025-10-10 00:00:00', 150000.00, 'Parcial', TRUE),
(1, 1, '2025-10-11 00:00:00', 85000.00, 'Total', TRUE),
(2, 2, '2025-10-12 00:00:00', 50000.00, 'Parcial', TRUE),
(2, 2, '2025-10-13 00:00:00', 125000.00, 'Total', TRUE);

