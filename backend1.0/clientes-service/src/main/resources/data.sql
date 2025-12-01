-- Datos de ejemplo
DELETE FROM clientes;

INSERT INTO clientes (id, nombre, id_empresa, contacto, cuit, telefono, email, condicion_iva, activo)
VALUES
    (1, 'Constructora San Jorge', 1, 'Juan Perez', '30-65748392-1', '3511234567', 'juan.perez@sanjorge.com', 'Responsable Inscripto', 1),
    (2, 'Inmobiliaria Los Alamos', 1, 'Maria Gomez', '30-78451236-2', '3512345678', 'maria.gomez@losalamos.com', 'Monotributo', 1),
    (3, 'Cooperativa Norte', 1, 'Carlos Lopez', '33-45781236-9', '3513456789', 'carlos.lopez@coopnorte.com', 'Consumidor Final', 1),
    (4, 'Desarrollos del Sur', 1, 'Ana Fernandez', '30-91234567-5', '3514567890', 'ana.fernandez@delsur.com', 'Exento', 1),
    (5, 'Grupo Urbano XXI', 2, 'Santiago Ruiz', '30-17894567-0', '3515678901', 'santiago.ruiz@grupourbano.com', 'Responsable Inscripto', 1),
    (6, 'Consorcio Andino', 2, 'Veronica Diaz', '33-78914562-4', '3516789012', 'veronica.diaz@consorcioandino.com', 'Monotributo', 1),
    (7, 'Municipalidad de Villa Maria', 3, 'Laura Pereyra', '30-30765432-1', '3534876543', 'laura.pereyra@villamaria.gov.ar', 'Consumidor Final', 1),
    (8, 'Hospitales Unidos', 2, 'Ricardo Funes', '30-55789456-3', '3517890123', 'ricardo.funes@hospitalesunidos.org', 'Exento', 1),
    (9, 'Parques Industriales SRL', 1, 'Gabriela Molina', '30-44556633-0', '3518901234', 'gabriela.molina@parquesindustriales.com', 'Responsable Inscripto', 1),
    (10, 'Universidad Metropolitana', 4, 'Esteban Quiroga', '30-66778855-9', '3519012345', 'esteban.quiroga@unimet.edu', 'Consumidor Final', 1);
