-- V8: Tabla de planes de suscripción
CREATE TABLE planes (
    id                          BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
    codigo                      NVARCHAR(50)   NOT NULL UNIQUE,  -- FREE, BASICO, PROFESIONAL, ENTERPRISE
    nombre                      NVARCHAR(100)  NOT NULL,
    descripcion                 NVARCHAR(500),
    precio_mensual_usd          DECIMAL(10,2)  NOT NULL DEFAULT 0,
    precio_anual_usd            DECIMAL(10,2)  NOT NULL DEFAULT 0,

    -- Límites de recursos (NULL = sin límite)
    max_usuarios                INT,
    max_obras_activas           INT,
    max_clientes                INT,
    max_proveedores             INT,
    max_transacciones_mes       INT,
    max_storage_mb              INT,
    dias_historial_reportes     INT,           -- NULL = sin límite, 30 = últimos 30 días, 0 = sin acceso

    -- Feature flags
    tiene_facturas              BIT NOT NULL DEFAULT 0,
    tiene_agenda                BIT NOT NULL DEFAULT 0,
    tiene_grupos_obras          BIT NOT NULL DEFAULT 0,
    tiene_exportar              BIT NOT NULL DEFAULT 0,
    tiene_push_notifications    BIT NOT NULL DEFAULT 0,
    tiene_soporte_prioritario   BIT NOT NULL DEFAULT 0,
    tiene_api_access            BIT NOT NULL DEFAULT 0,

    activo                      BIT NOT NULL DEFAULT 1,
    creado_en                   DATETIME2 NOT NULL DEFAULT GETDATE(),
    ultima_actualizacion        DATETIME2
);

-- Seed: los 4 planes base
INSERT INTO planes (
    codigo, nombre, descripcion,
    precio_mensual_usd, precio_anual_usd,
    max_usuarios, max_obras_activas, max_clientes, max_proveedores,
    max_transacciones_mes, max_storage_mb, dias_historial_reportes,
    tiene_facturas, tiene_agenda, tiene_grupos_obras,
    tiene_exportar, tiene_push_notifications, tiene_soporte_prioritario, tiene_api_access
) VALUES
(
    'FREE', 'Free', 'Plan gratuito para explorar la plataforma',
    0, 0,
    1, 3, 10, 10,
    10, 50, 0,
    0, 0, 0,
    0, 0, 0, 0
),
(
    'BASICO', 'Básico', 'Para empresas chicas que recién arrancan',
    149.00, 1490.00,
    3, 20, 100, 50,
    150, 1024, 30,
    1, 1, 0,
    0, 0, 0, 0
),
(
    'PROFESIONAL', 'Profesional', 'Para equipos en crecimiento con gestión completa',
    399.00, 3990.00,
    10, 100, NULL, NULL,
    NULL, 10240, NULL,
    1, 1, 1,
    1, 1, 1, 0
),
(
    'ENTERPRISE', 'Enterprise', 'Sin límites — para constructoras grandes',
    899.00, 8990.00,
    NULL, NULL, NULL, NULL,
    NULL, 102400, NULL,
    1, 1, 1,
    1, 1, 1, 1
);
