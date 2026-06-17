-- ============================================
-- SCRIPT DE DATOS DE EJEMPLO
-- Obras, Clientes, Proveedores, Transacciones y Facturas
-- ============================================

-- ============================================
-- 1. DATOS MAESTROS - OBRAS SERVICE
-- ============================================

-- Estados de obra
INSERT INTO [sgo_obras].[dbo].[estado_obra] ([nombre], [activo], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('PRESUPUESTADA', 1, GETDATE(), 'INSERT'),
    ('COTIZADA', 1, GETDATE(), 'INSERT'),
    ('ADJUDICADA', 1, GETDATE(), 'INSERT'),
    ('PERDIDA', 1, GETDATE(), 'INSERT'),
    ('EN_PROGRESO', 1, GETDATE(), 'INSERT'),
    ('FINALIZADA', 1, GETDATE(), 'INSERT'),
    ('FACTURADA_PARCIAL', 1, GETDATE(), 'INSERT'),
    ('FACTURADA', 1, GETDATE(), 'INSERT'),
    ('COBRADA', 1, GETDATE(), 'INSERT');

-- Estados de pago
INSERT INTO [sgo_obras].[dbo].[estado_pago] ([estado], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('PENDIENTE', GETDATE(), 'INSERT'),
    ('PARCIAL', GETDATE(), 'INSERT'),
    ('PAGADO', GETDATE(), 'INSERT');

-- Estados de tarea
INSERT INTO [sgo_obras].[dbo].[estado_tarea] ([nombre], [activo], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('PENDIENTE', 1, GETDATE(), 'INSERT'),
    ('EN_PROGRESO', 1, GETDATE(), 'INSERT'),
    ('COMPLETADA', 1, GETDATE(), 'INSERT');

-- ============================================
-- 2. DATOS MAESTROS - PROVEEDORES SERVICE
-- ============================================

-- Tipos de proveedores
INSERT INTO [sgo_proveedores].[dbo].[tipo_proveedor] ([nombre], [activo], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('Materiales', 1, GETDATE(), 'INSERT'),
    ('Mano de Obra', 1, GETDATE(), 'INSERT'),
    ('Servicios', 1, GETDATE(), 'INSERT'),
    ('Equipamiento', 1, GETDATE(), 'INSERT');

-- Gremios
INSERT INTO [sgo_proveedores].[dbo].[gremios] ([nombre], [activo], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('Albañiles', 1, GETDATE(), 'INSERT'),
    ('Plomeros', 1, GETDATE(), 'INSERT'),
    ('Electricistas', 1, GETDATE(), 'INSERT'),
    ('Carpinteros', 1, GETDATE(), 'INSERT'),
    ('Pintores', 1, GETDATE(), 'INSERT'),
    ('Herreros', 1, GETDATE(), 'INSERT');

-- ============================================
-- 3. CLIENTES
-- ============================================

INSERT INTO [sgo_clientes].[dbo].[clientes] ([nombre], [id_empresa], [contacto], [cuit], [telefono], [email], [direccion], [condicion_iva], [activo], [creado_en], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('Inmobiliaria Desarrollo SA', NULL, 'Juan García', '30-12345678-9', '011-4756-8900', 'juan.garcia@inmobiliaria.com', 'Av. Corrientes 1234, CABA', 'RESPONSABLE_INSCRIPTO', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Constructora Vidal SRL', NULL, 'Roberto Vidal', '20-23456789-1', '011-4500-1200', 'roberto@constructoravidal.com', 'Calle 9 de Julio 567, La Plata', 'RESPONSABLE_INSCRIPTO', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Empresa de Obras Públicas', NULL, 'María López', '27-34567890-2', '011-5000-3400', 'maria@obrasublicas.gov', 'Paseo Colón 100, CABA', 'RESPONSABLE_INSCRIPTO', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Desarrollo Residencial Plus', NULL, 'Carlos Fernández', '23-45678901-3', '011-3000-5600', 'carlos@residencial.com', 'Libertador 2000, San Isidro', 'RESPONSABLE_INSCRIPTO', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Proyectos Comerciales SA', NULL, 'Andrea Martínez', '30-56789012-4', '011-4800-7800', 'andrea@proy-comerciales.com', 'Paraguay 1111, CABA', 'RESPONSABLE_INSCRIPTO', 1, GETDATE(), GETDATE(), 'INSERT');

-- ============================================
-- 4. PROVEEDORES
-- ============================================

INSERT INTO [sgo_proveedores].[dbo].[proveedores] ([nombre], [tipo_proveedor_id], [gremio_id], [dni_cuit], [contacto], [telefono], [email], [direccion], [activo], [creado_en], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('Construcciones López y Cía', 2, 1, '20-11223344-5', 'Pedro López', '011-4234-5678', 'pedro@construcciones.com', 'Calle 1 Nº 100, San Justo', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Materiales de Construcción Nacional', 1, NULL, '30-22334455-6', 'Jorge González', '011-4567-8901', 'jorge@matconst.com', 'Ruta 3 Km 15, Lomas de Zamora', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Electricidad Total SRL', 3, 3, '20-33445566-7', 'Fernando Ruiz', '011-5678-9012', 'fernando@electricidadtotal.com', 'Av. Hipólito Yrigoyen 800, Constitución', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Fontanería Moderna', 3, 2, '27-44556677-8', 'Miguel Torres', '011-6789-0123', 'miguel@fontaneria.com', 'Calle 5 Nº 250, Flores', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Acero y Metales SA', 4, 6, '30-55667788-9', 'Guillermo Castro', '011-7890-1234', 'guillermo@acerometales.com', 'Parque Industrial, Quilmes', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Carpintería Profesional', 3, 4, '23-66778899-0', 'Diego Silva', '011-8901-2345', 'diego@carpinteria.com', 'Calle 10 Nº 500, Flores', 1, GETDATE(), GETDATE(), 'INSERT'),
    ('Pinturas y Acabados', 1, 5, '20-77889900-1', 'Marcelo Gómez', '011-9012-3456', 'marcelo@pinturas.com', 'Av. Acoyte 1500, Caballito', 1, GETDATE(), GETDATE(), 'INSERT');

-- ============================================
-- 5. OBRAS
-- ============================================

INSERT INTO [sgo_obras].[dbo].[obras] ([id_cliente], [estado_obra], [nombre], [direccion], [fecha_presupuesto], [fecha_inicio], [fecha_fin], [fecha_adjudicada], [fecha_perdida], [presupuesto], [beneficio_global], [tiene_comision], [beneficio], [comision], [activo], [creado_en], [notas], [memoria_descriptiva], [condiciones_presupuesto], [observaciones_presupuesto], [requiere_factura], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    (1, 'EN_PROGRESO', 'Edificio Residencial 15 Pisos', 'Av. del Libertador 5000, San Isidro', '2025-01-15', '2025-03-01', '2026-06-30', '2025-02-10', NULL, 2500000.00, 1, 1, 250000.00, 50000.00, 1, GETDATE(), 'Proyecto de envergadura. Cumplimiento de cronograma crítico', 'Construcción de edificio residencial de 15 pisos con 120 departamentos', 'Pago 30% seña, 40% durante ejecución, 30% final', 'Requiere inspecciones municipales cada 2 semanas', 1, GETDATE(), 'INSERT'),
    (2, 'EN_PROGRESO', 'Centro Comercial Downtown', 'Calle 9 de Julio 1000, CABA', '2025-01-20', '2025-02-15', '2025-12-31', '2025-02-01', NULL, 1800000.00, 1, 1, 150000.00, 30000.00, 1, GETDATE(), 'Centro comercial con locales y parking subterráneo', 'Construcción de centro comercial de 4 niveles', 'Pago 25% seña, 50% durante obra, 25% final', 'Coordinación permanente con comerciantes locales', 1, GETDATE(), 'INSERT'),
    (3, 'ADJUDICADA', 'Ampliación Hospital Regional', 'Av. 7 de Agosto 500, La Plata', '2025-02-01', NULL, '2026-12-31', '2025-02-20', NULL, 3200000.00, 1, 0, 320000.00, NULL, 1, GETDATE(), 'Obra pública, fiscalización de municipio', 'Ampliación de 40 camas de hospital público', 'Pago por certificado de avance. Fiscalización municipal', 'Aún no inicia, planificado para marzo 2025', 0, GETDATE(), 'INSERT'),
    (4, 'EN_PROGRESO', 'Complejo de Oficinas Premium', 'Córdoba 3500, CABA', '2025-01-10', '2025-01-20', '2025-10-15', '2025-01-15', NULL, 1200000.00, 0, 1, NULL, 60000.00, 1, GETDATE(), 'Oficinas clase A con todas las comodidades', 'Construcción de oficinas modernas clase A, 8 pisos', 'Pago mensual 10% del presupuesto', 'Cliente muy exigente, requiere estándares ISO', 1, GETDATE(), 'INSERT'),
    (5, 'PRESUPUESTADA', 'Viviendas Unifamiliares Barrio Nuevo', 'Ruta 2 Km 30, Berazategui', '2025-02-15', NULL, NULL, NULL, NULL, 800000.00, 1, 0, 80000.00, NULL, 1, GETDATE(), 'Proyecto de 20 viviendas unifamiliares', 'Construcción de 20 viviendas unifamiliares en lote de 2 hectáreas', 'Presupuesto en evaluación', 'A la espera de aprobación de municipio', 0, GETDATE(), 'INSERT'),
    (1, 'FINALIZADA', 'Reparación Fachada Edificio Comercial', 'Lavalle 800, CABA', '2024-09-01', '2024-10-01', '2024-11-30', '2024-09-15', NULL, 180000.00, 0, 1, NULL, 15000.00, 1, GETDATE(), 'Reparación de fachada completada exitosamente', 'Reparación integral de fachada de edificio de 1950', 'Pago al finalizar', 'Obra finalizada sin inconvenientes', 1, GETDATE(), 'INSERT');

-- ============================================
-- 6. TAREAS (Asignaciones a proveedores)
-- ============================================

INSERT INTO [sgo_obras].[dbo].[tareas] ([id_obra], [id_proveedor], [numero_orden], [estado_tarea], [nombre], [descripcion], [porcentaje], [fecha_inicio], [fecha_fin], [creado_en], [activo], [baja_obra], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    (1, 1, 1, 'EN_PROGRESO', 'Excavación y Cimientos', 'Excavación del terreno y construcción de cimientos hasta -2.50m', 25.0, '2025-03-01', '2025-04-15', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (1, 1, 2, 'PENDIENTE', 'Estructura de Hormigón', 'Construcción de estructura de hormigón armado de 15 pisos', 0.0, '2025-04-16', '2025-07-31', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (1, 3, 3, 'PENDIENTE', 'Instalaciones Eléctricas', 'Red eléctrica completa con sistemas de respaldo', 0.0, '2025-06-01', '2025-08-31', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (1, 4, 4, 'PENDIENTE', 'Instalaciones Sanitarias', 'Red de agua, desagüe y calefacción', 0.0, '2025-06-15', '2025-08-15', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (2, 1, 1, 'EN_PROGRESO', 'Estructura Base Centro Comercial', 'Excavación y cimientos del centro comercial', 30.0, '2025-02-15', '2025-05-30', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (2, 6, 2, 'PENDIENTE', 'Trabajos de Carpintería', 'Puertas, marcos y estructuras de madera', 0.0, '2025-05-01', '2025-09-15', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (2, 7, 3, 'PENDIENTE', 'Pintura y Acabados', 'Pintura integral y acabados finales', 0.0, '2025-08-01', '2025-11-30', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (3, 1, 1, 'PENDIENTE', 'Ampliación Estructura Hospital', 'Nueva ala norte del hospital', 0.0, '2025-03-15', '2025-09-30', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (4, 5, 1, 'EN_PROGRESO', 'Estructura Metálica Oficinas', 'Estructura de acero para edificio de oficinas', 40.0, '2025-01-20', '2025-04-20', GETDATE(), 1, 0, GETDATE(), 'INSERT'),
    (4, 3, 2, 'PENDIENTE', 'Instalaciones Completas', 'Electricidad, agua, gas y telecomunicaciones', 0.0, '2025-04-01', '2025-08-31', GETDATE(), 1, 0, GETDATE(), 'INSERT');

-- ============================================
-- 7. COSTOS DE OBRAS
-- ============================================

INSERT INTO [sgo_obras].[dbo].[obra_costo] ([id_proveedor], [precio_unitario], [id_estado_pago], [id_obra], [tipo_costo], [item_numero], [descripcion], [unidad], [cantidad], [beneficio], [subtotal], [total], [activo], [baja_obra], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    (1, 150000.00, 'PENDIENTE', 1, 'ORIGINAL', '001', 'Excavación y Cimientos', 'm³', 500.0, 0.00, 75000000.00, 75000000.00, 1, 0, GETDATE(), 'INSERT'),
    (2, 8500.00, 'PENDIENTE', 1, 'ORIGINAL', '002', 'Materiales Construcción - Ladrillos', 'unidad', 2000.0, 0.00, 17000000.00, 17000000.00, 1, 0, GETDATE(), 'INSERT'),
    (3, 45000.00, 'PENDIENTE', 1, 'ORIGINAL', '003', 'Instalación Eléctrica', 'jornada', 200.0, 0.00, 9000000.00, 9000000.00, 1, 0, GETDATE(), 'INSERT'),
    (4, 35000.00, 'PENDIENTE', 1, 'ORIGINAL', '004', 'Instalación Sanitaria', 'jornada', 150.0, 0.00, 5250000.00, 5250000.00, 1, 0, GETDATE(), 'INSERT'),
    (1, 120000.00, 'PARCIAL', 2, 'ORIGINAL', '001', 'Estructura Base Centro', 'm³', 400.0, 0.00, 48000000.00, 48000000.00, 1, 0, GETDATE(), 'INSERT'),
    (2, 7500.00, 'PENDIENTE', 2, 'ORIGINAL', '002', 'Materiales - Hormigón', 'm³', 300.0, 0.00, 2250000.00, 2250000.00, 1, 0, GETDATE(), 'INSERT'),
    (5, 95000.00, 'PENDIENTE', 4, 'ORIGINAL', '001', 'Estructura Metálica', 'tonelada', 80.0, 0.00, 7600000.00, 7600000.00, 1, 0, GETDATE(), 'INSERT'),
    (3, 40000.00, 'PENDIENTE', 4, 'ORIGINAL', '002', 'Instalaciones Eléctricas', 'jornada', 150.0, 0.00, 6000000.00, 6000000.00, 1, 0, GETDATE(), 'INSERT');

-- ============================================
-- 8. RELACIÓN OBRA-PROVEEDOR
-- ============================================

INSERT INTO [sgo_obras].[dbo].[obra_proveedor] ([id_obra], [id_proveedor])
VALUES
    (1, 1), (1, 2), (1, 3), (1, 4),
    (2, 1), (2, 2), (2, 6), (2, 7),
    (3, 1),
    (4, 5), (4, 3),
    (6, 1), (6, 3);

-- ============================================
-- 9. MOVIMIENTOS DE PROVEEDORES
-- ============================================

INSERT INTO [sgo_proveedores].[dbo].[movimientos] ([proveedor_id], [obra_id], [descripcion], [monto], [monto_pagado], [pagado], [creado_en])
VALUES
    (1, 1, 'Pago Etapa 1 - Excavación', 750000.00, 300000.00, 0, GETDATE()),
    (2, 1, 'Suministro Materiales - Lote 1', 500000.00, 500000.00, 1, GETDATE()),
    (3, 1, 'Instalación Eléctrica - Etapa 1', 200000.00, 0.00, 0, GETDATE()),
    (4, 1, 'Instalación Sanitaria - Etapa 1', 150000.00, 75000.00, 0, GETDATE()),
    (1, 2, 'Centro Comercial - Estructura Base', 600000.00, 300000.00, 0, GETDATE()),
    (5, 4, 'Suministro Acero - Oficinas', 400000.00, 200000.00, 0, GETDATE()),
    (6, 2, 'Trabajos Carpintería Centro Comercial', 180000.00, 0.00, 0, GETDATE()),
    (7, 2, 'Pintura y Acabados - Estimado', 250000.00, 0.00, 0, GETDATE());

-- ============================================
-- 10. TIPOS DE TRANSACCIÓN
-- ============================================

INSERT INTO [sgo_transacciones].[dbo].[tipo_transaccion] ([nombre], [activo], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    ('PAGO_CLIENTE', 1, GETDATE(), 'INSERT'),
    ('PAGO_PROVEEDOR', 1, GETDATE(), 'INSERT'),
    ('INGRESO', 1, GETDATE(), 'INSERT'),
    ('EGRESO', 1, GETDATE(), 'INSERT'),
    ('AJUSTE', 1, GETDATE(), 'INSERT');

-- ============================================
-- 11. TRANSACCIONES
-- ============================================

INSERT INTO [sgo_transacciones].[dbo].[transacciones] ([id_obra], [tipo_asociado], [id_asociado], [id_tipo_transaccion], [fecha], [monto], [forma_pago], [medio_pago], [concepto], [factura_cobrada], [activo], [baja_obra], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    (1, 'PROVEEDOR', 1, 'PAGO_PROVEEDOR', '2025-03-15', 300000.00, 'Transferencia', 'Banco Nación', 'Pago parcial excavación y cimientos', 0, 1, 0, GETDATE(), 'INSERT'),
    (1, 'PROVEEDOR', 2, 'PAGO_PROVEEDOR', '2025-03-20', 500000.00, 'Transferencia', 'Banco Provincia', 'Pago total materiales lote 1', 1, 1, 0, GETDATE(), 'INSERT'),
    (1, 'CLIENTE', 1, 'PAGO_CLIENTE', '2025-03-01', 750000.00, 'Transferencia', 'Banco Galicia', 'Seña edificio residencial 15 pisos', 1, 1, 0, GETDATE(), 'INSERT'),
    (2, 'CLIENTE', 2, 'PAGO_CLIENTE', '2025-02-20', 450000.00, 'Transferencia', 'Banco Itaú', 'Anticipo centro comercial', 1, 1, 0, GETDATE(), 'INSERT'),
    (2, 'PROVEEDOR', 1, 'PAGO_PROVEEDOR', '2025-03-10', 300000.00, 'Cheque', 'Cheque propio', 'Avance obra estructura', 0, 1, 0, GETDATE(), 'INSERT'),
    (4, 'PROVEEDOR', 5, 'PAGO_PROVEEDOR', '2025-02-15', 200000.00, 'Transferencia', 'Banco Santander', 'Pago parcial acero', 0, 1, 0, GETDATE(), 'INSERT'),
    (4, 'CLIENTE', 4, 'PAGO_CLIENTE', '2025-02-01', 360000.00, 'Transferencia', 'Banco BBVA', 'Seña oficinas premium', 1, 1, 0, GETDATE(), 'INSERT'),
    (1, 'PROVEEDOR', 4, 'PAGO_PROVEEDOR', '2025-04-05', 75000.00, 'Transferencia', 'Banco Nación', 'Pago parcial instalación sanitaria', 1, 1, 0, GETDATE(), 'INSERT'),
    (1, 'PROVEEDOR', 3, 'PAGO_PROVEEDOR', '2025-04-10', 100000.00, 'Cheque', 'Cheque propio', 'Avance instalación eléctrica', 0, 1, 0, GETDATE(), 'INSERT'),
    (6, 'CLIENTE', 1, 'PAGO_CLIENTE', '2024-11-30', 180000.00, 'Transferencia', 'Banco Hipotecario', 'Pago total reparación fachada', 1, 1, 0, GETDATE(), 'INSERT');

-- ============================================
-- 12. FACTURAS
-- ============================================

INSERT INTO [sgo_transacciones].[dbo].[facturas] ([id_cliente], [id_obra], [monto], [monto_restante], [fecha], [descripcion], [estado], [nombre_archivo], [path_archivo], [activo], [impacta_cta_cte], [id_transaccion], [ultima_actualizacion], [tipo_actualizacion])
VALUES
    (1, 1, 750000.00, 1750000.00, '2025-03-01', 'Factura A001 - Seña Edificio Residencial 15 Pisos', 'EMITIDA', 'Factura_A001_2025-03-01.pdf', '/facturas/2025/03/', 1, 1, 3, GETDATE(), 'INSERT'),
    (2, 2, 450000.00, 1350000.00, '2025-02-20', 'Factura A002 - Anticipo Centro Comercial Downtown', 'EMITIDA', 'Factura_A002_2025-02-20.pdf', '/facturas/2025/02/', 1, 1, 4, GETDATE(), 'INSERT'),
    (4, 4, 360000.00, 840000.00, '2025-02-01', 'Factura A003 - Seña Complejo Oficinas Premium', 'EMITIDA', 'Factura_A003_2025-02-01.pdf', '/facturas/2025/02/', 1, 1, 7, GETDATE(), 'INSERT'),
    (1, 6, 180000.00, 0.00, '2024-11-30', 'Factura A004 - Reparación Fachada Completada', 'PAGADA', 'Factura_A004_2024-11-30.pdf', '/facturas/2024/11/', 1, 1, 10, GETDATE(), 'INSERT'),
    (1, 1, 1000000.00, 1000000.00, '2025-04-15', 'Factura A005 - Primer certificado de avance Residencial', 'EMITIDA', 'Factura_A005_2025-04-15.pdf', '/facturas/2025/04/', 1, 1, NULL, GETDATE(), 'INSERT'),
    (3, 3, 960000.00, 960000.00, '2025-02-20', 'Factura A006 - Ampliación Hospital Regional (1° certificado)', 'EMITIDA', 'Factura_A006_2025-02-20.pdf', '/facturas/2025/02/', 1, 0, NULL, GETDATE(), 'INSERT');

-- ============================================
-- 13. VERIFICACIÓN - Mostrar resumen de datos insertados
-- ============================================

PRINT '========== RESUMEN DE DATOS INSERTADOS =========='
PRINT 'Base de datos: sgo_clientes'
SELECT COUNT(*) as 'Total Clientes' FROM [sgo_clientes].[dbo].[clientes];

PRINT 'Base de datos: sgo_obras'
SELECT COUNT(*) as 'Total Obras' FROM [sgo_obras].[dbo].[obras];
SELECT COUNT(*) as 'Total Tareas' FROM [sgo_obras].[dbo].[tareas];
SELECT COUNT(*) as 'Total Costos' FROM [sgo_obras].[dbo].[obra_costo];

PRINT 'Base de datos: sgo_proveedores'
SELECT COUNT(*) as 'Total Proveedores' FROM [sgo_proveedores].[dbo].[proveedores];
SELECT COUNT(*) as 'Total Movimientos' FROM [sgo_proveedores].[dbo].[movimientos];

PRINT 'Base de datos: sgo_transacciones'
SELECT COUNT(*) as 'Total Transacciones' FROM [sgo_transacciones].[dbo].[transacciones];
SELECT COUNT(*) as 'Total Facturas' FROM [sgo_transacciones].[dbo].[facturas];

PRINT '========== FIN DE INSERCIONES =========='
