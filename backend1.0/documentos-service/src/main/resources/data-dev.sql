-- Documentos de ejemplo para DEV (coherentes)
DELETE FROM documentos;

INSERT INTO documentos (id_documento, id_obra, id_asociado, tipo_asociado, nombre_archivo, path_archivo, fecha, observacion, creado_en, id_tipo_documento)
VALUES
    (1, 1, 1, 'PROVEEDOR', 'certificacion-hormigon.pdf', 'obras/1/certificacion-hormigon.pdf', '2025-02-14', 'Certificacion parcial de hormigonado', '2025-02-14 09:00:00', 'COMPROBANTE'),
    (2, 1, NULL, NULL, 'planos-logistica.pdf', 'obras/1/planos-logistica.pdf', '2025-01-08', 'Plano de replanteo', '2025-01-08 10:00:00', 'OTRO'),
    (3, 2, 2, 'CLIENTE', 'anticipo-cliente.pdf', 'clientes/2/anticipo-cliente.pdf', '2025-03-12', 'Anticipo firmado por cliente', '2025-03-12 11:00:00', 'RECIBO'),
    (4, 3, 2, 'PROVEEDOR', 'orden-montaje-aulas.pdf', 'proveedores/2/orden-montaje-aulas.pdf', '2025-03-15', 'Orden para montaje de aulas', '2025-03-15 09:15:00', 'FACTURA');
