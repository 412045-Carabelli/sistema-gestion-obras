-- V12: Agregar features whatsapp_bot y gantt; actualizar datos según nuevo modelo de negocio

ALTER TABLE planes ADD tiene_whatsapp_bot BIT NOT NULL DEFAULT 0;
GO
ALTER TABLE planes ADD tiene_gantt BIT NOT NULL DEFAULT 0;
GO

-- BÁSICO: 1 usuario, 10 obras, 20 clientes, 10 proveedores, 100 tx/mes, 500 MB
UPDATE planes SET
    descripcion               = 'Para arrancar a gestionar tus obras sin complicaciones.',
    precio_mensual_usd        = 149.00,
    precio_anual_usd          = 1490.00,
    max_usuarios              = 1,
    max_obras_activas         = 10,
    max_clientes              = 20,
    max_proveedores           = 10,
    max_transacciones_mes     = 100,
    max_storage_mb            = 500,
    dias_historial_reportes   = 0,
    tiene_facturas            = 0,
    tiene_agenda              = 0,
    tiene_grupos_obras        = 0,
    tiene_exportar            = 0,
    tiene_push_notifications  = 0,
    tiene_soporte_prioritario = 0,
    tiene_api_access          = 0,
    tiene_whatsapp_bot        = 0,
    tiene_gantt               = 0
WHERE codigo = 'BASICO';
GO

-- PROFESIONAL: multiusuario, 50 obras, 80 clientes, 100 proveedores, 200 tx/mes, 750 MB
UPDATE planes SET
    descripcion               = 'Para equipos en crecimiento con gestión completa.',
    precio_mensual_usd        = 399.00,
    precio_anual_usd          = 3990.00,
    max_usuarios              = NULL,
    max_obras_activas         = 50,
    max_clientes              = 80,
    max_proveedores           = 100,
    max_transacciones_mes     = 200,
    max_storage_mb            = 750,
    dias_historial_reportes   = NULL,
    tiene_facturas            = 1,
    tiene_agenda              = 1,
    tiene_grupos_obras        = 1,
    tiene_exportar            = 1,
    tiene_push_notifications  = 1,
    tiene_soporte_prioritario = 1,
    tiene_api_access          = 0,
    tiene_whatsapp_bot        = 1,
    tiene_gantt               = 1
WHERE codigo = 'PROFESIONAL';
GO

-- ENTERPRISE: 100 obras, 100 clientes, 200 proveedores, 500 tx/mes, 1.5 GB
UPDATE planes SET
    descripcion               = 'Para constructoras con alto volumen de proyectos.',
    precio_mensual_usd        = 899.00,
    precio_anual_usd          = 8990.00,
    max_usuarios              = NULL,
    max_obras_activas         = 100,
    max_clientes              = 100,
    max_proveedores           = 200,
    max_transacciones_mes     = 500,
    max_storage_mb            = 1536,
    dias_historial_reportes   = NULL,
    tiene_facturas            = 1,
    tiene_agenda              = 1,
    tiene_grupos_obras        = 1,
    tiene_exportar            = 1,
    tiene_push_notifications  = 1,
    tiene_soporte_prioritario = 1,
    tiene_api_access          = 1,
    tiene_whatsapp_bot        = 1,
    tiene_gantt               = 1
WHERE codigo = 'ENTERPRISE';
GO

-- FREE: desactivar (ya no se ofrece como plan nuevo)
UPDATE planes SET activo = 0 WHERE codigo = 'FREE';
GO
