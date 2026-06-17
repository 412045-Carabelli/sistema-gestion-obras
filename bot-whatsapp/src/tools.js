const api = require('./sgo-api');

/**
 * Herramientas SGO en formato OpenAI/Groq (function calling).
 */
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'buscar_obras',
      description: 'Busca obras de construcción por nombre parcial, o lista todas las activas si no se da nombre.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre parcial para filtrar. Omitir para listar todas.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_obra',
      description: 'Obtiene el detalle completo de una obra por su ID.',
      parameters: {
        type: 'object',
        properties: {
          obra_id: { type: 'number', description: 'ID numérico de la obra.' },
        },
        required: ['obra_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cuenta_corriente_obra',
      description: 'Obtiene la cuenta corriente de una obra: presupuesto, costos, cobrado, saldo pendiente y movimientos.',
      parameters: {
        type: 'object',
        properties: {
          obra_id: { type: 'number', description: 'ID de la obra.' },
        },
        required: ['obra_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estado_financiero_obra',
      description: 'Obtiene el estado financiero resumido de una obra (ingresos, egresos, resultado).',
      parameters: {
        type: 'object',
        properties: {
          obra_id: { type: 'number', description: 'ID de la obra.' },
        },
        required: ['obra_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_clientes',
      description: 'Busca clientes por nombre parcial, o lista todos si no se da nombre.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre parcial para filtrar.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cuenta_corriente_cliente',
      description: 'Obtiene la cuenta corriente de un cliente: total costos, cobrado, saldo.',
      parameters: {
        type: 'object',
        properties: {
          cliente_id: { type: 'number', description: 'ID del cliente.' },
        },
        required: ['cliente_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_proveedores',
      description: 'Busca proveedores por nombre parcial, o lista todos si no se da nombre.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre parcial para filtrar.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cuenta_corriente_proveedor',
      description: 'Obtiene la cuenta corriente de un proveedor: total costos, pagado, saldo a pagar.',
      parameters: {
        type: 'object',
        properties: {
          proveedor_id: { type: 'number', description: 'ID del proveedor.' },
        },
        required: ['proveedor_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tareas_proximas',
      description: 'Lista las tareas de obras y agenda próximas a vencer.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'number', description: 'Ventana en días. Default 7.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deudas_globales',
      description: 'Resumen global de deudas: qué clientes deben y qué se le debe a proveedores.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dashboard_financiero',
      description: 'Panel financiero global: totales ingresados, a facturar, saldos generales.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// Normaliza acentos/tildes para búsquedas más tolerantes
function sinAcentos(str) {
  if (!str) return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function ejecutarTool(name, input) {
  switch (name) {
    case 'buscar_obras':               return await api.buscarObras(sinAcentos(input.nombre));
    case 'obtener_obra':               return await api.obtenerObra(input.obra_id);
    case 'cuenta_corriente_obra':      return await api.cuentaCorrienteObra(input.obra_id);
    case 'estado_financiero_obra':     return await api.estadoFinancieroObra(input.obra_id);
    case 'buscar_clientes':            return await api.buscarClientes(sinAcentos(input.nombre));
    case 'cuenta_corriente_cliente':   return await api.cuentaCorrienteCliente(input.cliente_id);
    case 'buscar_proveedores':         return await api.buscarProveedores(sinAcentos(input.nombre));
    case 'cuenta_corriente_proveedor': return await api.cuentaCorrienteProveedor(input.proveedor_id);
    case 'tareas_proximas':            return await api.tareasProximas(input.dias);
    case 'deudas_globales':            return await api.deudasGlobales();
    case 'dashboard_financiero':       return await api.dashboardFinanciero();
    default: throw new Error(`Herramienta desconocida: ${name}`);
  }
}

module.exports = { TOOLS, ejecutarTool };
