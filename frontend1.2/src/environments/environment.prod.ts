// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiGateway: 'https://api-gateway-bp4v.onrender.com',
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
    reportes: '/bff/reportes'
  }
};
