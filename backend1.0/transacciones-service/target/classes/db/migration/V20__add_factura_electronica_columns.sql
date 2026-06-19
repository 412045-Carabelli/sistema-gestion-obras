-- V20: Columnas para factura electrónica ARCA/TusFacturasAPP
ALTER TABLE facturas
ADD
    cae                 NVARCHAR(20)   NULL,
    vencimiento_cae     DATE           NULL,
    comprobante_nro     NVARCHAR(20)   NULL,
    tipo_comprobante    NVARCHAR(50)   NULL,
    afip_qr             NVARCHAR(MAX)  NULL,
    comprobante_pdf_url NVARCHAR(MAX)  NULL,
    fecha_emision_afip  DATETIME2      NULL;
