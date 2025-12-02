-- Proveedores de ejemplo (coherentes)
DELETE FROM proveedores;

INSERT INTO proveedores (id, nombre, dni_cuit, contacto, telefono, email, direccion, tipo, gremio, activo)
VALUES
    (1, 'Concretos Andinos', '30-12345678-9', 'Pablo Ochoa', '3517001000', 'pablo.ochoa@concretos.com', 'Av Libertad 1010', 'Materiales', 'Hormigon', 1),
    (2, 'Elevaciones Norte', '30-22334455-6', 'Lucia Rivero', '3517002000', 'lucia.rivero@elevaciones.com', 'Ruta 9 km 12', 'Alquiler', 'Maquinaria', 1),
    (3, 'Metalurgica Centro', '27-33445566-7', 'Franco Caceres', '3517003000', 'franco.caceres@metalcentro.com', 'Colombia 443', 'Materiales', 'Metal', 1),
    (4, 'Termica Patagon', '27-44556677-8', 'Sonia Ledesma', '3517004000', 'sonia.ledesma@termicapatagon.com', 'Av Colon 2244', 'Servicios', 'Climatizacion', 1);
