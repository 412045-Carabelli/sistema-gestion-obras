const axios = require('axios');
const { API_GATEWAY_URL, DIAS_VENCIMIENTO } = require('./config');

const api = axios.create({ baseURL: API_GATEWAY_URL, timeout: 30000 });

async function buscarObras(nombre) {
  const res = await api.get('/bff/obras');
  const obras = res.data || [];
  if (!nombre) return obras;
  const q = nombre.toLowerCase();
  return obras.filter(o => o.nombre && o.nombre.toLowerCase().includes(q));
}

async function obtenerObra(id) {
  const res = await api.get(`/bff/obras/${id}`);
  return res.data;
}

async function buscarClientes(nombre) {
  const res = await api.get('/bff/clientes', { params: { search: nombre, size: 20 } });
  return res.data?.content || res.data || [];
}

async function buscarProveedores(nombre) {
  const res = await api.get('/bff/proveedores');
  const proveedores = res.data?.content || res.data || [];
  if (!nombre) return proveedores;
  const q = nombre.toLowerCase();
  return proveedores.filter(p => p.nombre && p.nombre.toLowerCase().includes(q));
}

async function cuentaCorrienteObra(obraId) {
  const res = await api.post('/bff/reportes/financieros/cuenta-corriente-obra', { obraId });
  return res.data;
}

async function cuentaCorrienteCliente(clienteId) {
  const res = await api.post('/bff/reportes/financieros/cuenta-corriente-cliente', { clienteId });
  return res.data;
}

async function cuentaCorrienteProveedor(proveedorId) {
  const res = await api.post('/bff/reportes/financieros/cuenta-corriente-proveedor', { proveedorId });
  return res.data;
}

async function estadoFinancieroObra(obraId) {
  const res = await api.get(`/bff/reportes/financieros/estado-obra/${obraId}`);
  return res.data;
}

async function deudasGlobales() {
  const res = await api.post('/bff/reportes/financieros/deudas-globales', {});
  return res.data;
}

async function dashboardFinanciero() {
  const res = await api.post('/bff/reportes/financieros/dashboard', {});
  return res.data;
}

async function tareasProximas(dias = DIAS_VENCIMIENTO) {
  const res = await api.get('/bff/notificaciones/proximas', { params: { dias } });
  return res.data;
}

module.exports = {
  buscarObras,
  obtenerObra,
  buscarClientes,
  buscarProveedores,
  cuentaCorrienteObra,
  cuentaCorrienteCliente,
  cuentaCorrienteProveedor,
  estadoFinancieroObra,
  deudasGlobales,
  dashboardFinanciero,
  tareasProximas,
};
