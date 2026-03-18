// src/environments/environment.ts
export const environment = {
  production: false,
  apiGateway: 'http://localhost:8080',
  endpoints: {
    obras: '/bff/v1/obras',
    estado_pago: '/bff/v1/estado-pago',
    clientes: '/bff/v1/clientes',
    proveedores: '/bff/v1/proveedores',
    tipo_documentos: '/bff/v1/tipo-documentos',
    tipo_proveedores: '/bff/v1/tipo-proveedor',
    tareas: '/bff/v1/tareas',
    costos: '/bff/v1/costos',
    documentos: '/bff/v1/documentos',
    facturas: '/bff/v1/facturas',
    transacciones: '/bff/v1/transacciones',
    tipo_transaccion: '/bff/v1/tipo-transaccion',
    reportes: '/bff/v1/reportes',
    backups: '/bff/v1/backups',
    auditoria: '/bff/v1/auditoria',
    estados_obras: '/bff/v1/estados-obras',
    condicion_iva: '/bff/v1/condicion-iva',
    gremios: '/bff/v1/gremios'
  }
};

