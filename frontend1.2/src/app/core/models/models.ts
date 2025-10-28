export interface Cliente {
  id: number;
  nombre: string;
  id_empresa?: number;
  contacto?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  creado_en?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface TipoProveedor {
  id: number;
  nombre: string; // mano_obra | materiales | servicios
  activo: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface Proveedor {
  id: number;
  tipo_proveedor: TipoProveedor;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  creado_en?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface EstadoObra {
  id: number;
  nombre: string; // presupuestada | cotizada | adjudicada | iniciada | en_progreso | finalizada | perdida
  activo: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface EstadoTarea {
  id: number;
  nombre: string;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface TipoTransaccion {
  id: number;
  nombre: string; // cobro | pago
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface Obra {
  id?: number;
  id_cliente?: number;
  cliente: Cliente;
  obra_estado: EstadoObra;
  nombre: string;
  direccion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  fecha_adjudicada?: string;
  fecha_perdida?: string;
  presupuesto?: number;
  gastado?: number;
  beneficio_global?: boolean;
  beneficio?: number;
  comision?: number;
  tiene_comision?: boolean;
  activo?: boolean;
  creado_en?: string;
  notas?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
  tareas?: Tarea[];
  costos?: ObraCosto[];
}

export interface ObraProveedor {
  id: number;
  id_obra: number;
  id_proveedor: number;
}

export interface EstadoPago {
  id: number;
  estado: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface ObraCosto {
  id?: number;
  id_obra: number;
  id_proveedor?: number;
  proveedor?: Proveedor;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  iva?: number;
  beneficio?: number;
  estado_pago?: EstadoPago;
  id_estado_pago?: number;
  subtotal: number;
  total: number;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface Tarea {
  id?: number;
  id_obra: number;
  id_proveedor?: number;
  proveedor?: Proveedor;
  estado_tarea: EstadoTarea;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  creado_en?: string;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface Transaccion {
  id?: number;
  id_obra: number;
  id_asociado?: number;
  tipo_asociado?: string;
  tipo_transaccion: TipoTransaccion;
  fecha?: string | Date;
  monto: number;
  forma_pago: string;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface TipoDocumento {
  id_tipo_documento: number;
  nombre: string; // factura | recibo | remito | pagare | comprobante | otro
}

export interface Documento {
  id_documento: number;
  id_obra: number;
  id_asociado: number;
  tipo_asociado: string;
  nombre_archivo: string;
  path_archivo: string;
  fecha: string;
  observacion?: string;
  creado_en?: string;
  tipo_documento: TipoDocumento;
}
