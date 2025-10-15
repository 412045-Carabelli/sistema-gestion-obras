-- =====================================================
-- ESTADOS DE OBRA
-- =====================================================
INSERT INTO estado_obra (nombre, activo)
VALUES
    ('Presupuestada', 1),
    ('Adjudicada', 1),
    ('En Progreso', 1),
    ('Finalizada', 1);

-- =====================================================
-- OBRAS (mock sin dependencia del servicio de clientes)
-- =====================================================
INSERT INTO obras (
    id_cliente,
    id_estado_obra,
    nombre,
    direccion,
    fecha_inicio,
    fecha_adjudicada,
    presupuesto,
    gastado,
    beneficio_global,
    beneficio,
    comision,
    tiene_comision,
    activo
)
VALUES
    (1, 2, 'Edificio San Martín', 'San Martín 1450, Córdoba', '2024-05-01 00:00:00', '2024-04-25 00:00:00',
     12000000, 2500000, 1, 25, 5.0, 1, 1),

    (2, 3, 'Residencial Los Álamos', 'Av. Circunvalación 555, Córdoba', '2024-03-15 00:00:00', '2024-03-10 00:00:00',
     8900000, 4000000, 1, 15, NULL, 0, 1);

-- Asociaciones obra-proveedor
INSERT INTO obra_proveedor (id_obra, id_proveedor) VALUES
    (1, 1),  -- ✅ obra 1 con proveedor 1
    (1, 2),  -- obra 1 con proveedor 2 (ejemplo)
    (1, 3),  -- obra 1 con proveedor 3 (ejemplo)
    (2, 1);  -- obra 2 con proveedor 1 (ejemplo)

INSERT INTO estado_pago (estado) VALUES
     ('Pendiente'),
     ('Parcial'),
     ('Pagado');

-- ============================================
-- 🔸 COSTOS para la Obra 1 (Edificio San Martín)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (1, 1, 30000.00, 1, 'Hormigón elaborado H21', 'm³', 50.000, 5.00, 1500000.00, 1815000.00, TRUE),
    (1, 2, 1800.00, 2, 'Hierros del 8 y 12 mm', 'kg', 1200.000, 3.00, 2160000.00, 2613600.00, TRUE),
    (1, 3, 200.00, 1, 'Ladrillos cerámicos huecos', 'u', 10000.000, 40.00, 2000000.00, 2440000.00, TRUE),
    (1, 4, 2500.00, 3, 'Mano de obra albañilería', 'hs', 800.000, 0.00, 2000000.00, 2000000.00, TRUE),
    (1, 5, 60000.00, 2, 'Alquiler de encofrado', 'semana', 4.000, 0.00, 240000.00, 290400.00, TRUE);

-- ============================================
-- 🔸 COSTOS para la Obra 2 (Obra ficticia)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (2, 2, 4500.00, 1, 'Revestimiento cerámico', 'm²', 300.000, 0.00, 1350000.00, 1633500.00, TRUE),
    (2, 1, 2500.00, 1, 'Pintura interior', 'lts', 200.000, 20.00, 500000.00, 605000.00, TRUE),
    (2, 3, 80000.00, 2, 'Puertas placas + instalación', 'u', 21.00, 50000.00, 1200000.00, 1512000.00, TRUE);

INSERT INTO estado_tarea (nombre) VALUES
('Pendiente'),
('En progreso'),
('Completada');

INSERT INTO tareas (id_obra, id_proveedor, id_estado_tarea, nombre, descripcion, fecha_inicio, fecha_fin, activo, creado_en) VALUES
(1, 1, 1, 'Colado de cimientos', 'Preparación de base y colado de hormigón.', '2024-05-01 00:00:00', '2024-05-05 00:00:00', 1, CURRENT_TIMESTAMP),
(1, 2, 2, 'Colocación de hierros', 'Colocación de armaduras de hierro.', '2024-05-06 00:00:00', '2024-05-10 00:00:00', 1, CURRENT_TIMESTAMP),
(1, 3, 2, 'Levantamiento de muros', 'Muros exteriores con ladrillos cerámicos.', '2024-05-11 00:00:00', '2024-05-20 00:00:00', 1, CURRENT_TIMESTAMP),
(1, 4, 1, 'Revoque grueso', 'Aplicación de revoque grueso en muros.', '2024-05-21 00:00:00', '2024-05-28 00:00:00', 1, CURRENT_TIMESTAMP),
(1, 5, 3, 'Montaje de encofrados', 'Colocación de encofrados de primer piso.', '2024-05-29 00:00:00', '2024-06-05 00:00:00', 1, CURRENT_TIMESTAMP),
(2, 1, 1, 'Excavación de terreno', 'Nivelación y preparación del terreno.', '2024-06-01 00:00:00', '2024-06-03 00:00:00', 1, CURRENT_TIMESTAMP),
(2, 3, 2, 'Estructura metálica', 'Instalación de estructura metálica.', '2024-06-04 00:00:00', '2024-06-10 00:00:00', 1, CURRENT_TIMESTAMP),
(2, 4, 1, 'Revestimiento', 'Aplicación de revestimiento interior y exterior.', '2024-06-11 00:00:00', '2024-06-18 00:00:00', 1, CURRENT_TIMESTAMP);