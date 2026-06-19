-- Tabla de configuración general de la aplicación (clave/valor)
CREATE TABLE app_config (
    clave           NVARCHAR(100)   NOT NULL PRIMARY KEY,
    valor           NVARCHAR(MAX),
    descripcion     NVARCHAR(255),
    actualizado_en  DATETIME2       NOT NULL DEFAULT GETDATE()
);

-- Valores iniciales
INSERT INTO app_config (clave, valor, descripcion, actualizado_en) VALUES
    ('empresa_nombre',        'Meliquina Construcciones',  'Nombre de la empresa',                                              GETDATE()),
    ('propietario_nombre',    'Pablo Pezzini',             'Nombre del propietario / usuario principal',                        GETDATE()),
    ('whatsapp_owner_phone',  '',                          'Teléfono para notificaciones WhatsApp (formato: 549XXXXXXXXXX). Si está vacío no se envían notificaciones.', GETDATE()),
    ('logo_url',              '/logo-meliquina.png',       'URL del logo de la empresa (ruta relativa o URL completa)',          GETDATE());
