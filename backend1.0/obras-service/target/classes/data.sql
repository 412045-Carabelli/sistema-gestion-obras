-- =====================================================
-- ESTADOS DE OBRA
-- =====================================================
INSERT INTO estado_obra (nombre, activo)
VALUES
    ('Presupuestada', 1),
    ('Cotizada', 1),
    ('Adjudicada', 1),
    ('Perdida', 1),
    ('En Progreso', 1),
    ('Finalizada', 1),
    ('Facturada', 1);

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
    beneficio_global,
    beneficio,
    comision,
    tiene_comision,
    activo
)
VALUES
    (1, 2, 'Edificio San Martín', 'San Martín 1450, Córdoba', '2024-05-01 00:00:00', '2024-04-25 00:00:00',
     12000000, 1, 25, 5.0, 1, 1),

    (2, 3, 'Residencial Los Álamos', 'Av. Circunvalación 555, Córdoba', '2024-03-15 00:00:00', '2024-03-10 00:00:00',
     8900000, 1, 15, NULL, 0, 1),

    (3, 5, 'Centro Comercial Las Flores', 'Av. Colón 2300, Córdoba', '2024-04-01 00:00:00', '2024-03-20 00:00:00',
     14500000, 1, 18, 2.50, 1, 1),

    (5, 2, 'Parque Industrial Los Cedros', 'Ruta 9 Km 12, Córdoba', '2024-07-01 00:00:00', '2024-06-20 00:00:00',
     21000000, 1, 22, NULL, 0, 1),

    (6, 3, 'Hospital Regional Nueva Esperanza', 'Bv. Mitre 980, Villa María', '2024-08-05 00:00:00', '2024-07-15 00:00:00',
     32500000, 1, 30, 7.50, 1, 1),

    (7, 1, 'Escuela Técnica Provincial 125', 'Int. Ponce 450, Río Cuarto', '2024-09-10 00:00:00', '2024-08-30 00:00:00',
     9500000, 0, 12, NULL, 0, 1);

-- Asociaciones obra-proveedor
INSERT INTO obra_proveedor (id_obra, id_proveedor) VALUES
    (1, 1),  -- ✅ obra 1 con proveedor 1
    (1, 2),  -- obra 1 con proveedor 2 (ejemplo)
    (1, 3),  -- obra 1 con proveedor 3 (ejemplo)
    (1, 5),
    (2, 1),  -- obra 2 con proveedor 1 (ejemplo)
    (2, 3),
    (3, 2),
    (3, 6),
    (3, 11),
    (4, 1),
    (4, 7),
    (4, 8),
    (4, 13),
    (5, 5),
    (5, 6),
    (5, 9),
    (5, 14),
    (6, 3),
    (6, 7),
    (6, 10),
    (6, 11),
    (6, 12);

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

-- ============================================
-- 🔸 COSTOS para la Obra 3 (Centro Comercial Las Flores)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (3, 2, 3200.00, 1, 'Estructura metálica ligera', 'kg', 900.000, 12.00, 2880000.00, 3225600.00, TRUE),
    (3, 6, 5800.00, 2, 'Tableros eléctricos principales', 'u', 450.000, 15.00, 2610000.00, 3001500.00, TRUE),
    (3, 11, 1900.00, 1, 'Pintura epoxi de alta resistencia', 'lts', 650.000, 18.00, 1235000.00, 1458300.00, TRUE),
    (3, 7, 85000.00, 2, 'Logística y fletes especiales', 'viaje', 6.000, 8.00, 510000.00, 550800.00, TRUE);

-- ============================================
-- 🔸 COSTOS para la Obra 4 (Parque Industrial Los Cedros)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (4, 1, 28000.00, 1, 'Hormigón para plateas industriales', 'm³', 60.000, 7.00, 1680000.00, 1797600.00, TRUE),
    (4, 13, 4500.00, 2, 'Estructuras metálicas pesadas', 'kg', 750.000, 20.00, 3375000.00, 4050000.00, TRUE),
    (4, 8, 120000.00, 3, 'Servicio de grúa torre', 'mes', 3.000, 0.00, 360000.00, 360000.00, TRUE),
    (4, 12, 950.00, 1, 'Equipos de seguridad industrial', 'set', 180.000, 12.00, 171000.00, 191520.00, TRUE);

-- ============================================
-- 🔸 COSTOS para la Obra 5 (Hospital Regional Nueva Esperanza)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (5, 5, 72000.00, 2, 'Alquiler de módulos hospitalarios', 'mes', 4.000, 5.00, 288000.00, 302400.00, TRUE),
    (5, 14, 158000.00, 1, 'Sistema de climatización integral', 'u', 12.000, 18.00, 1896000.00, 2237280.00, TRUE),
    (5, 9, 42000.00, 1, 'Instalaciones sanitarias hospitalarias', 'm', 180.000, 22.00, 7560000.00, 9223200.00, TRUE),
    (5, 6, 4600.00, 3, 'Sistema de respaldo eléctrico UPS', 'kVA', 150.000, 15.00, 690000.00, 793500.00, TRUE);

-- ============================================
-- 🔸 COSTOS para la Obra 6 (Escuela Técnica Provincial 125)
-- ============================================
INSERT INTO obra_costo (id_obra, id_proveedor, precio_unitario, id_estado_pago, descripcion, unidad, cantidad, beneficio, subtotal, total, activo)
VALUES
    (6, 3, 1450.00, 1, 'Ladrillos acústicos', 'u', 8000.000, 10.00, 11600000.00, 12760000.00, TRUE),
    (6, 10, 3100.00, 2, 'Aberturas DVH de aluminio', 'm²', 320.000, 18.00, 992000.00, 1170560.00, TRUE),
    (6, 11, 1850.00, 1, 'Pintura ignífuga interior', 'lts', 500.000, 16.00, 925000.00, 1073000.00, TRUE),
    (6, 7, 18000.00, 2, 'Transporte de paneles prefabricados', 'viaje', 18.000, 9.00, 324000.00, 353160.00, TRUE);

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
(2, 4, 1, 'Revestimiento', 'Aplicación de revestimiento interior y exterior.', '2024-06-11 00:00:00', '2024-06-18 00:00:00', 1, CURRENT_TIMESTAMP),
(3, 2, 1, 'Montaje de estructura metálica', 'Estructura de locales comerciales.', '2024-04-05 00:00:00', '2024-04-20 00:00:00', 1, CURRENT_TIMESTAMP),
(3, 6, 2, 'Instalación eléctrica principal', 'Tableros y cableado de media tensión.', '2024-04-21 00:00:00', '2024-05-10 00:00:00', 1, CURRENT_TIMESTAMP),
(3, 11, 1, 'Aplicación de pintura base', 'Pintura epoxi en zonas comunes.', '2024-05-15 00:00:00', '2024-05-25 00:00:00', 1, CURRENT_TIMESTAMP),
(4, 13, 1, 'Montaje de naves industriales', 'Colocación de columnas y vigas principales.', '2024-07-02 00:00:00', '2024-07-30 00:00:00', 1, CURRENT_TIMESTAMP),
(4, 1, 2, 'Hormigonado de plateas', 'Fundaciones para maquinaria pesada.', '2024-07-05 00:00:00', '2024-07-18 00:00:00', 1, CURRENT_TIMESTAMP),
(4, 12, 1, 'Implementación de seguridad', 'Entrega de elementos de protección personal.', '2024-07-10 00:00:00', '2024-07-12 00:00:00', 1, CURRENT_TIMESTAMP),
(5, 14, 1, 'Instalación de climatización', 'Montaje de chillers y ductos principales.', '2024-08-10 00:00:00', '2024-09-05 00:00:00', 1, CURRENT_TIMESTAMP),
(5, 9, 2, 'Montaje de redes sanitarias', 'Conexión a sala de máquinas y quirófanos.', '2024-08-15 00:00:00', '2024-09-12 00:00:00', 1, CURRENT_TIMESTAMP),
(5, 6, 2, 'Puesta en marcha eléctrica', 'Configuración de UPS y tableros críticos.', '2024-09-15 00:00:00', '2024-10-01 00:00:00', 1, CURRENT_TIMESTAMP),
(6, 3, 1, 'Levantamiento de aulas', 'Mampostería de aulas técnicas.', '2024-09-12 00:00:00', '2024-10-10 00:00:00', 1, CURRENT_TIMESTAMP),
(6, 10, 2, 'Colocación de aberturas', 'Instalación de carpintería de aluminio.', '2024-10-12 00:00:00', '2024-10-22 00:00:00', 1, CURRENT_TIMESTAMP),
(6, 11, 1, 'Pintura interior y exterior', 'Aplicación de pinturas ignífugas y látex.', '2024-10-25 00:00:00', '2024-11-08 00:00:00', 1, CURRENT_TIMESTAMP),
(6, 7, 1, 'Logística de equipamiento', 'Entrega y montaje de laboratorios móviles.', '2024-11-10 00:00:00', '2024-11-15 00:00:00', 1, CURRENT_TIMESTAMP);
