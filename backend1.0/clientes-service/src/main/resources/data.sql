-- Datos de ejemplo (coherentes)
DELETE FROM clientes;

INSERT INTO clientes (id, nombre, id_empresa, contacto, cuit, telefono, email, condicion_iva, activo)
VALUES
    (1, 'Logistica Sur SA', 1, 'Florencia Rios', '30-65748392-1', '3516001000', 'frio@logisticasur.com', 'Responsable Inscripto', 1),
    (2, 'Parques del Centro SRL', 1, 'Diego Palacios', '30-78451236-2', '3516002000', 'dpalacios@parquescentro.com', 'Monotributo', 1),
    (3, 'Educativa Horizonte', 2, 'Sofia Nadal', '33-45781236-9', '3516003000', 'snadal@horizonte.edu', 'Consumidor Final', 1);
