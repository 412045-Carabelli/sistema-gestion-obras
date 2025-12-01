-- Datos de ejemplo (perfil default)
DELETE FROM obra_costo;
DELETE FROM obra_proveedor;
DELETE FROM tareas;
DELETE FROM obras;

INSERT INTO obras (id, id_cliente, estado_obra, nombre, direccion, fecha_inicio, fecha_fin, fecha_adjudicada, fecha_perdida, presupuesto, beneficio_global, tiene_comision, beneficio, comision, notas, activo)
VALUES
    (1, 1, 'EN_PROGRESO', 'Centro Logistico Piedras', 'Parque Industrial Norte, Manzana 12', '2024-09-02 08:00:00', '2025-02-15 17:00:00', '2024-08-15 12:00:00', NULL, 1200000.00, 1, 0, 10.50, NULL, 'Fase de movimiento de suelo y hormigonado.', 1),
    (2, 2, 'ADJUDICADA', 'Torre Los Alamos', 'Bv San Juan 1020', '2024-10-01 08:00:00', '2025-05-30 17:00:00', '2024-08-20 09:00:00', NULL, 950000.00, 1, 0, 8.50, NULL, 'Estructura aprobada, en espera de permisos finales.', 1),
    (3, 3, 'PRESUPUESTADA', 'Planta Cooperativa Norte', 'Ruta 19 km 4', '2024-11-05 09:00:00', NULL, NULL, NULL, 650000.00, 0, 1, 6.00, 3.50, 'Presentacion enviada al consejo.', 1),
    (4, 8, 'EN_PROGRESO', 'Hospital del Sur Etapa I', 'Av Garibaldi 1440', '2024-07-01 08:00:00', '2025-01-30 18:00:00', '2024-06-10 10:00:00', NULL, 1850000.00, 1, 0, 12.00, NULL, 'Urgencias y guardia en prioridad.', 1),
    (5, 10, 'COTIZADA', 'Campus Universidad Tech', 'Av Universitaria 2200', '2025-01-10 08:00:00', NULL, NULL, NULL, 1250000.00, 0, 1, 7.00, 5.00, 'Propuesta enviada, pendiente de pliegos finales.', 1),
    (6, 6, 'PRESUPUESTADA', 'Barrio Andino', 'Villa Allende, loteo Sierra Alta', '2024-12-01 08:00:00', NULL, NULL, NULL, 480000.00, 1, 0, 6.50, NULL, 'Casas modelo y urbanizacion basica.', 1);

INSERT INTO tareas (id, id_obra, id_proveedor, estado_tarea, nombre, descripcion, fecha_inicio, fecha_fin, creado_en, activo)
VALUES
    (1, 1, 1, 'EN_PROGRESO', 'Movimiento de suelo', 'Terraplenes y compactacion inicial', '2024-09-02 08:00:00', '2024-09-18 17:00:00', '2024-09-02 08:05:00', 1),
    (2, 1, 3, 'EN_PROGRESO', 'Tablero y conexion provisoria', 'Alimentacion de obrador', '2024-09-10 09:00:00', '2024-09-22 18:00:00', '2024-09-10 08:45:00', 1),
    (3, 2, 2, 'PENDIENTE', 'Montaje de estructura', 'Plan de izaje y soldaduras', '2024-10-05 08:00:00', '2024-11-20 18:00:00', '2024-09-25 09:10:00', 1),
    (4, 2, 5, 'PENDIENTE', 'Frentes vidriados', 'Cubicacion de panos y tiempos', '2024-11-01 08:00:00', '2024-12-15 17:00:00', '2024-10-01 08:15:00', 1),
    (5, 3, 7, 'EN_PROGRESO', 'Ingenieria basica', 'Planos de fundaciones', '2024-11-05 09:00:00', '2024-11-28 18:00:00', '2024-11-04 12:00:00', 1),
    (6, 4, 4, 'EN_PROGRESO', 'Cielo raso y pintura', 'Primeras salas de guardia', '2024-08-12 08:00:00', '2024-09-30 18:00:00', '2024-08-10 08:00:00', 1),
    (7, 5, 10, 'PENDIENTE', 'Logistica de gruas', 'Reservas de equipo segun cronograma', '2025-01-12 08:00:00', '2025-01-25 17:00:00', '2024-12-20 09:00:00', 1),
    (8, 6, 11, 'PENDIENTE', 'Paneles mockup', 'Fabricacion de muestra en taller', '2024-12-05 08:00:00', '2024-12-20 17:00:00', '2024-11-28 10:30:00', 1);

INSERT INTO obra_costo (id, id_obra, id_proveedor, descripcion, unidad, cantidad, precio_unitario, beneficio, subtotal, total, id_estado_pago, activo)
VALUES
    (1, 1, 1, 'Hormigon H21 y bombeo', 'm3', 120.000, 3200.00, 8.50, 384000.00, 416640.00, 'PARCIAL', 1),
    (2, 1, 9, 'Traslado de modulos y pallets', 'viaje', 18.000, 8500.00, 0.00, 153000.00, 153000.00, 'PENDIENTE', 1),
    (3, 1, 3, 'Tablero electrico provisorio', 'unidad', 1.000, 78000.00, 5.00, 78000.00, 81900.00, 'PAGADO', 1),
    (4, 2, 2, 'Estructura metalica ligera', 'tn', 12.500, 72000.00, 10.00, 900000.00, 990000.00, 'PARCIAL', 1),
    (5, 2, 5, 'Carpinteria de aluminio y vidrio', 'm2', 180.000, 2800.00, 8.00, 504000.00, 544320.00, 'PENDIENTE', 1),
    (6, 3, 7, 'Documentacion y planos ejecutivos', 'paquete', 1.000, 120000.00, 0.00, 120000.00, 120000.00, 'PAGADO', 1),
    (7, 4, 4, 'Pintura interior etapa I', 'm2', 850.000, 1250.00, 12.00, 1062500.00, 1190000.00, 'PARCIAL', 1),
    (8, 4, 8, 'Sistema de deteccion e incendio', 'kit', 1.000, 280000.00, 6.00, 280000.00, 296800.00, 'PENDIENTE', 1),
    (9, 5, 10, 'Alquiler plataforma elevadora', 'dia', 25.000, 18000.00, 0.00, 450000.00, 450000.00, 'PARCIAL', 1),
    (10, 6, 11, 'Paneles prefabricados fachada', 'unidad', 36.000, 12000.00, 9.00, 432000.00, 470880.00, 'PENDIENTE', 1);

INSERT INTO obra_proveedor (id_obra, id_proveedor)
VALUES
    (1, 1), (1, 3), (1, 9),
    (2, 2), (2, 5),
    (3, 7),
    (4, 4), (4, 8),
    (5, 10),
    (6, 11);
