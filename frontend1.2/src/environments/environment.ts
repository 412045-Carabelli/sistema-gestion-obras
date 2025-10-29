// src/environments/environment.ts
export const environment = {
  production: false,
  apiGateway: 'http://localhost:8080',
  endpoints: {
    obras: '/bff/obras',
    estado_pago: '/bff/estado_pago',
    clientes: '/bff/clientes',
    proveedores: '/bff/proveedores',
    tipo_proveedores: '/bff/tipo_proveedor',
    tareas: '/bff/tareas',
    costos: '/bff/costos',
    documentos: '/bff/documentos',
    transacciones: '/bff/transacciones',
    tipo_transaccion: '/bff/tipo_transaccion',
    reportes: '/bff/reportes',
    estados_obras: '/bff/estados_obras'
  }
};
