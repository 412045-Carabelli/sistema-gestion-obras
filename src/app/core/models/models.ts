// =========================
// MODELOS MAESTROS
// =========================

export interface Cliente {
  id_cliente: number;
  nombre: string;
  contacto?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  creado_en?: string;
}

export interface TipoProveedor {
  id_tipo_proveedor: number;
  nombre: string; // mano_obra | materiales | servicios
  activo: boolean;
}

export interface Proveedor {
  id_proveedor: number;
  id_tipo_proveedor: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  creado_en?: string;
}

export interface EstadoObra {
  id_estado_obra: number;
  nombre: string; // presupuestada | cotizada | adjudicada | iniciada | en_progreso | finalizada | perdida
  activo: boolean;
}

export interface EstadoTarea {
  id_estado_tarea: number;
  nombre: string; // pendiente | en_progreso | completada
  activo?: boolean;
}

export interface TipoTransaccion {
  id_tipo_transaccion: number;
  nombre: string; // cobro | pago
  activo: boolean;
}

// =========================
// MODELOS DE OBRAS
// =========================

export interface Obra {
  id_obra: number;
  id_cliente: number;
  id_estado_obra: number;
  nombre: string;
  direccion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_adjudicada?: string;
  fecha_perdida?: string;
  presupuesto?: number;
  gastado?: number;
  activo: boolean;
  creado_en?: string;
}

export interface ObraProveedor {
  id_obra: number;
  id_proveedor: number;
}

export interface ObraCosto {
  id_obra_costo: number;
  id_obra: number;
  id_proveedor?: number;
  descripcion: string;
  unidad?: string;
  cantidad: number;
  precio_unitario: number;
  iva?: number;
  subtotal?: number;
  total: number;
  activo?: boolean;
}

export interface Tarea {
  id_tarea: number;
  id_obra: number;
  id_proveedor: number;
  id_estado_tarea: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  creado_en?: string;
}

// =========================
// MODELOS DE DOCUMENTOS Y MOVIMIENTOS
// =========================

export interface Cotizacion {
  id_cotizacion: number;
  id_obra: number;
  version: number;
  estado: string; // borrador | enviada | aceptada | rechazada
  fecha_creacion: string;
  fecha_envio?: string;
  total: number;
  pdf?: Uint8Array;
  activo: boolean;
}

export interface CotizacionItem {
  id_cotizacion_item: number;
  id_cotizacion: number;
  descripcion: string;
  unidad?: string;
  cantidad: number;
  precio_unitario: number;
  iva: number;
  subtotal: number;
  total: number;
}

export interface Factura {
  id_factura: number;
  id_obra: number;
  numero: string;
  fecha_emision: string;
  total: number;
  pdf?: Uint8Array;
  activo: boolean;
}

export interface Recibo {
  id_recibo: number;
  id_obra: number;
  id_proveedor: number;
  numero: string;
  fecha: string;
  total: number;
  pdf?: Uint8Array;
  activo: boolean;
}

export interface Transaccion {
  id_transaccion?: number;
  id_obra: number;
  id_tipo_transaccion: number;
  id_factura?: number;
  id_recibo?: number;
  fecha?: string;
  monto: number;
  parcial_o_total: 'parcial' | 'total';
  activo?: boolean;
}

// Vista de transacciones rotuladas
export interface TransaccionRotulada extends Transaccion {
  etiqueta: 'FC' | 'RBOS' | 'N/A';
}
