-- Documentos de ejemplo
DELETE FROM documentos;

INSERT INTO documentos (id_documento, id_obra, id_asociado, tipo_asociado, nombre_archivo, path_archivo, fecha, observacion, creado_en, id_tipo_documento)
VALUES
    (1, 1, 1, 'PROVEEDOR', 'certificacion-obra1.pdf', 'obras/1/certificacion-obra1.pdf', '2024-09-20', 'Certificacion de avance septiembre', '2024-09-20 09:00:00', 'COMPROBANTE'),
    (2, 1, NULL, NULL, 'planos-lote1.pdf', 'obras/1/planos-lote1.pdf', '2024-09-05', 'Plano de replanteo', '2024-09-05 10:00:00', 'OTRO'),
    (3, 2, 2, 'CLIENTE', 'anticipo-cliente.pdf', 'clientes/2/anticipo-cliente.pdf', '2024-10-02', 'Anticipo firmado por cliente', '2024-10-02 11:00:00', 'RECIBO'),
    (4, 4, 4, 'PROVEEDOR', 'remito-pinturas.pdf', 'proveedores/4/remito-pinturas.pdf', '2024-08-25', 'Entrega de pintura etapa I', '2024-08-25 15:30:00', 'REMITO'),
    (5, 5, 10, 'PROVEEDOR', 'orden-compra-maquinaria.pdf', 'proveedores/10/orden-compra-maquinaria.pdf', '2024-12-28', 'Reserva de equipos para enero', '2024-12-28 09:15:00', 'FACTURA'),
    (6, 6, 11, 'PROVEEDOR', 'ficha-panel-mockup.pdf', 'proveedores/11/ficha-panel-mockup.pdf', '2024-12-06', 'Ficha tecnica del mockup', '2024-12-06 14:10:00', 'OTRO');
