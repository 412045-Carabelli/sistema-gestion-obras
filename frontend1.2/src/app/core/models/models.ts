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
  estado_pago?: number;
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

export interface ReportFilter {
  obraId?: number;
  clienteId?: number;
  proveedorId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface EstadoObrasFilter {
  estados?: number[];
  fechaInicio?: string;
  fechaFin?: string;
  clienteId?: number;
}

export interface IngresosEgresosResponse {
  totalIngresos: number;
  totalEgresos: number;
  detallePorObra: Array<{
    obraId: number;
    obraNombre: string;
    clienteId: number;
    clienteNombre: string;
    ingresos: number;
    egresos: number;
  }>;
}

export interface EstadoFinancieroObraResponse {
  obraId: number;
  obraNombre: string;
  clienteId: number;
  clienteNombre: string;
  estadoObra: string;
  presupuesto: number;
  costos: number;
  cobros: number;
  pagos: number;
  utilidadNeta: number;
  notas?: string;
}

export interface FlujoCajaResponse {
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  movimientos: Array<{
    transaccionId: number;
    fecha: string;
    tipo: string;
    monto: number;
    obraId: number;
    obraNombre: string;
    formaPago: string;
    asociadoTipo: string;
    asociadoId: number;
  }>;
}

export interface PendientesResponse {
  pendientes: Array<{
    obraId: number;
    obraNombre: string;
    proveedorId: number;
    proveedorNombre: string;
    estadoPago: string;
    total: number;
    descripcion: string;
  }>;
}

export interface EstadoObrasResponse {
  obras: Array<{
    obraId: number;
    obraNombre: string;
    estado: string;
    clienteId: number;
    clienteNombre: string;
    fechaInicio: string;
    fechaFin: string;
    notas?: string;
  }>;
}

export interface AvanceTareasResponse {
  avances: Array<{
    obraId: number;
    obraNombre: string;
    porcentaje: number;
    totalTareas: number;
    tareasCompletadas: number;
    proveedorId?: number;
  }>;
}

export interface CostosPorCategoriaResponse {
  total: number;
  categorias: Array<{
    categoria: string;
    total: number;
    porcentaje: number;
  }>;
}

export interface ResumenGeneralResponse {
  totalObras: number;
  totalClientes: number;
  totalProveedores: number;
  totalIngresos: number;
  totalEgresos: number;
}

export interface RankingClientesResponse {
  clientes: Array<{
    clienteId: number;
    clienteNombre: string;
    cantidadObras: number;
    totalIngresos: number;
    totalEgresos: number;
  }>;
}

export interface RankingProveedoresResponse {
  proveedores: Array<{
    proveedorId: number;
    proveedorNombre: string;
    cantidadObras: number;
    totalCostos: number;
  }>;
}

export interface NotasObraResponse {
  obraId: number;
  obraNombre: string;
  estado: string;
  clienteId: number;
  clienteNombre: string;
  notas?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface MovimientoDashboard {
  id?: number;
  transaccionId: number;
  fecha: string;
  tipo: string;
  monto: number;
  obraId: number;
  obraNombre: string;
  formaPago: string;
  asociadoTipo: string;
  asociadoId: number;
}
