// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiGateway: 'https://api.misistema.com',
  endpoints: {
    obras: '/bff/obras',
    clientes: '/bff/clientes',
    proveedores: '/bff/proveedores',
    tareas: '/bff/obras/tareas',
    costos: '/bff/obras/costos',
    documentos: '/bff/documentos',
    transacciones: '/bff/transacciones',
    reportes: '/bff/reportes'
  }
};
