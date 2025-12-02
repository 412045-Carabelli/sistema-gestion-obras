-- Datos de ejemplo para DEV (coherentes)
DELETE FROM obra_costo;
DELETE FROM obra_proveedor;
DELETE FROM tareas;
DELETE FROM obras;

INSERT INTO obras (id, id_cliente, estado_obra, nombre, direccion, fecha_presupuesto, fecha_inicio, fecha_fin, fecha_adjudicada, fecha_perdida, presupuesto, beneficio_global, tiene_comision, beneficio, comision, notas, activo)
VALUES
    (1, 1, 'EN_PROGRESO', 'Planta Logistica Sur', 'Parque Industrial Norte, nave 3', '2025-01-02 10:00:00', '2025-01-10 08:00:00', '2025-07-15 17:00:00', '2025-01-05 12:00:00', NULL, 900000.00, 1, 1, 6.00, 4.50, 'Movimiento de suelos y platea principal.', 1),
    (2, 2, 'ADJUDICADA', 'Torre Parque Central', 'Bv San Juan 1020', '2025-01-20 09:00:00', '2025-02-01 08:00:00', '2025-10-30 18:00:00', '2025-01-25 11:00:00', NULL, 1250000.00, 1, 0, 8.00, NULL, 'Estructura y cerramientos livianos.', 1),
    (3, 3, 'PRESUPUESTADA', 'Escuela Tecnica Norte', 'Ruta 19 km 4', '2025-02-10 09:00:00', '2025-03-05 09:00:00', NULL, NULL, NULL, 450000.00, 0, 1, 5.00, 3.00, 'Aulas modulares provisorias.', 1);

INSERT INTO tareas (id, id_obra, id_proveedor, estado_tarea, nombre, descripcion, fecha_inicio, fecha_fin, creado_en, activo)
VALUES
    (1, 1, 1, 'Platea y fundaciones', 'Hormigonado de platea principal', '2025-01-12 08:00:00', '2025-01-28 17:00:00', '2025-01-10 08:05:00', 1),
    (2, 1, 2, 'Logistica de equipos', 'Grúa y elevaciones de paneles', '2025-01-20 09:00:00', '2025-02-05 18:00:00', '2025-01-18 09:10:00', 1),
    (3, 2, 3, 'Estructura metalica', 'Montaje de estructura liviana', '2025-02-05 08:00:00', '2025-03-10 17:00:00', '2025-02-02 10:00:00', 1),
    (4, 3, 2, 'Aulas modulares', 'Montaje y conexion de aulas', '2025-03-10 08:00:00', '2025-03-22 17:00:00', '2025-03-05 12:30:00', 1);

INSERT INTO obra_costo (id, id_obra, id_proveedor, descripcion, unidad, cantidad, precio_unitario, beneficio, subtotal, total, id_estado_pago, activo)
VALUES
    (1, 1, 1, 'Hormigon estructural', 'm3', 120.000, 3200.00, 5.00, 384000.00, 403200.00, 'PARCIAL', 1),
    (2, 1, 2, 'Alquiler grua 40tn', 'dia', 10.000, 15000.00, 0.00, 150000.00, 150000.00, 'PAGADO', 1),
    (3, 2, 3, 'Estructura metalica liviana', 'tn', 8.000, 65000.00, 10.00, 520000.00, 572000.00, 'PARCIAL', 1),
    (4, 2, 4, 'Climatizacion piso 1', 'kit', 1.000, 90000.00, 0.00, 90000.00, 90000.00, 'PENDIENTE', 1),
    (5, 3, 2, 'Montaje aulas provisorias', 'jornada', 5.000, 14000.00, 0.00, 70000.00, 70000.00, 'PAGADO', 1);

INSERT INTO obra_proveedor (id_obra, id_proveedor)
VALUES
    (1, 1), (1, 2),
    (2, 3), (2, 4),
    (3, 2);
