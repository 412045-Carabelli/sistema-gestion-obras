-- Solo tablas auxiliares para PROD (docker)
-- Estados de obra
INSERT OR IGNORE INTO estado_obra (nombre, activo)
VALUES
    ('Presupuestada', 1),
    ('Cotizada', 1),
    ('Adjudicada', 1),
    ('Perdida', 1),
    ('En Progreso', 1),
    ('Finalizada', 1),
    ('Facturada', 1);

-- Estados de pago
INSERT OR IGNORE INTO estado_pago (estado) VALUES
     ('Pendiente'),
     ('Parcial'),
     ('Pagado');

-- Estados de tarea
INSERT OR IGNORE INTO estado_tarea (nombre) VALUES
('Pendiente'),
('En progreso'),
('Completada');


