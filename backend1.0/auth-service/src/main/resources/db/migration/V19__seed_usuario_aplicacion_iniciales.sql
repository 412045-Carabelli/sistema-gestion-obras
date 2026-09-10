-- V19: Otorgar accesos iniciales a FREZCO y BUILDR_SUPP.
-- V18 crea aplicacion/usuario_aplicacion y ya deja SGO habilitado para todos los usuarios
-- existentes. Esta migracion agrega los accesos adicionales pedidos:
--   Pablo (99):    SGO (via V18), FREZCO, BUILDR_SUPP
--   Magda (10100): SGO (via V18), FREZCO
--   Gino  (100):   SGO (via V18), FREZCO, BUILDR_SUPP

MERGE usuario_aplicacion AS target
USING (VALUES
    (99,    'FREZCO'),
    (99,    'BUILDR_SUPP'),
    (10100, 'FREZCO'),
    (100,   'FREZCO'),
    (100,   'BUILDR_SUPP')
) AS src (usuario_id, aplicacion)
    ON target.usuario_id = src.usuario_id AND target.aplicacion = src.aplicacion
WHEN NOT MATCHED THEN
    INSERT (usuario_id, aplicacion, activo)
    VALUES (src.usuario_id, src.aplicacion, 1);
GO
