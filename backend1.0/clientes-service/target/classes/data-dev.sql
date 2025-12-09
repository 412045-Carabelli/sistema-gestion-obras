-- Clientes mock SOLO para DEV
INSERT INTO clientes (nombre, id_empresa, contacto, telefono, email, activo, condicion_iva)
VALUES
    ('Constructora San Jorge', 1, 'Juan Perez', '3511234567', 'juan.perez@sanjorge.com', 1, 'RESPONSABLE_INSCRIPTO'),
    ('Inmobiliaria Los Alamos', 1, 'Maria Gomez', '3512345678', 'maria.gomez@losalamos.com', 1, 'MONOTRIBUTO'),
    ('Cooperativa Norte', 1, 'Carlos Lopez', '3513456789', 'carlos.lopez@coopnorte.com', 1, 'EXENTO'),
    ('Desarrollos del Sur', 1, 'Ana Fernandez', '3514567890', 'ana.fernandez@delsur.com', 1, 'RESPONSABLE_INSCRIPTO'),
    ('Grupo Urbano XXI', 2, 'Santiago Ruiz', '3515678901', 'santiago.ruiz@grupourbano.com', 1, 'MONOTRIBUTO'),
    ('Consorcio Andino', 2, 'Veronica Diaz', '3516789012', 'veronica.diaz@consorcioandino.com', 1, 'CONSUMIDOR_FINAL'),
    ('Municipalidad de Villa Maria', 3, 'Laura Pereyra', '3534876543', 'laura.pereyra@villamaria.gov.ar', 1, 'EXENTO'),
    ('Hospitales Unidos', 2, 'Ricardo Funes', '3517890123', 'ricardo.funes@hospitalesunidos.org', 1, 'RESPONSABLE_INSCRIPTO'),
    ('Parques Industriales SRL', 1, 'Gabriela Molina', '3518901234', 'gabriela.molina@parquesindustriales.com', 1, 'RESPONSABLE_INSCRIPTO'),
    ('Universidad Metropolitana', 4, 'Esteban Quiroga', '3519012345', 'esteban.quiroga@unimet.edu', 1, 'EXENTO');
