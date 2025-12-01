-- Proveedores de ejemplo para DEV con IDs fijos
DELETE FROM proveedores;

INSERT INTO proveedores (id, nombre, dni_cuit, contacto, telefono, email, direccion, tipo, gremio, activo)
VALUES
    (1, 'Hormigonera Andina', '30-12345678-9', 'Pablo Ochoa', '3517001000', 'pablo.ochoa@andina.com', 'Av Libertad 1010', 'Materiales', 'Hormigon', 1),
    (2, 'Metalurgica El Taller', '30-22334455-6', 'Lucia Rivero', '3517002000', 'lucia.rivero@eltaller.com', 'Ruta 9 km 12', 'Materiales', 'Metal', 1),
    (3, 'Luminotecnia Centro', '27-33445566-7', 'Franco Caceres', '3517003000', 'franco.caceres@luminotecnia.com', 'Colombia 443', 'Servicios', 'Electricidad', 1),
    (4, 'Pinturas Delta', '27-44556677-8', 'Sonia Ledesma', '3517004000', 'sonia.ledesma@delta.com', 'Av Colon 2244', 'Materiales', 'Pintura', 1),
    (5, 'Carpinteria El Roble', '23-77889900-1', 'Diego Romero', '3517005000', 'diego.romero@elroble.com', 'Los Alamos 880', 'Servicios', 'Carpinteria', 1),
    (6, 'Vidrieria Sur', '30-55667788-9', 'Marta Leal', '3517006000', 'marta.leal@vidrieriasur.com', 'Boulevard Sur 311', 'Materiales', 'Vidrio', 1),
    (7, 'Ingenieria Norte', '30-11223344-5', 'Tomas Pereyra', '3517007000', 'tomas.pereyra@ingenierianorte.com', 'Obispo Trejo 455', 'Servicios', 'Ingenieria', 1),
    (8, 'Seguridad Industrial SRL', '30-66778899-0', 'Andrea Bravo', '3517008000', 'andrea.bravo@segind.com', 'Av Sabattini 1720', 'Servicios', 'Seguridad', 1),
    (9, 'Transporte El Puente', '30-99887766-5', 'Javier Campos', '3517009000', 'javier.campos@elpuente.com', 'Circunvalacion 5', 'Servicios', 'Logistica', 1),
    (10, 'Maquinarias Ruta 20', '30-88776655-4', 'Celeste Moyano', '3517010000', 'celeste.moyano@ruta20.com', 'Ruta 20 km 5', 'Alquiler', 'Maquinaria', 1),
    (11, 'Prefabricados Centro', '30-77665544-3', 'Hernan Silva', '3517011000', 'hernan.silva@prefabricados.com', 'Av La Voz 1550', 'Materiales', 'Prefabricados', 1),
    (12, 'Sistemas Termicos SA', '30-66554433-2', 'Daniela Sosa', '3517012000', 'daniela.sosa@termicos.com', 'Catamarca 2211', 'Materiales', 'Climatizacion', 1);
