// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiGateway: 'http://localhost:8080',
  endpoints: {
    obras: '/bff/obras',
    estado_pago: '/bff/estado-pago',
    clientes: '/bff/clientes',
    proveedores: '/bff/proveedores',
    tipo_documentos: '/bff/tipo-documentos',
    tipo_proveedores: '/bff/tipo-proveedor',
    tareas: '/bff/tareas',
    costos: '/bff/costos',
    documentos: '/bff/documentos',
    facturas: '/bff/facturas',
    transacciones: '/bff/transacciones',
    tipo_transaccion: '/bff/tipo-transaccion',
    reportes: '/bff/reportes',
    estados_obras: '/bff/estados-obras',
    condicion_iva: '/bff/condicion-iva',
    gremios: '/bff/gremios'
  }
};
