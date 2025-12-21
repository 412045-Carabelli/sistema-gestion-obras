export type RecordOption = { label: string; name: string };

export type CondicionIva =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL';

export const CONDICIONES_IVA_OPCIONES: RecordOption[] = [
  {label: 'Responsable Inscripto', name: 'RESPONSABLE_INSCRIPTO'},
  {label: 'Monotributo', name: 'MONOTRIBUTO'},
  {label: 'Exento', name: 'EXENTO'},
  {label: 'Consumidor Final', name: 'CONSUMIDOR_FINAL'}
];

export const CONDICION_IVA_LABELS: Record<CondicionIva, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor Final'
};

export interface Cliente {
  id: number;
  nombre: string;
  id_empresa?: number;
  contacto?: string;
  direccion?: string;
  condicion_iva?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  condicionIva?: CondicionIva;
  activo?: boolean;
  creado_en?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export type TipoProveedor = RecordOption;

export interface Proveedor {
  id: number;
  tipo_proveedor: string;
  nombre: string;
  direccion?: string;
  gremio?: string;
  cuit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  creado_en?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export type EstadoObra = RecordOption;

export type EstadoTarea = RecordOption;

export type TipoTransaccion = RecordOption;

export interface Obra {
  id?: number;
  id_cliente?: number;
  cliente: Cliente;
  obra_estado: string;
  nombre: string;
  direccion?: string;
  fecha_inicio: string;
  fecha_presupuesto?: string;
  fecha_fin?: string;
  fecha_adjudicada?: string;
  fecha_perdida?: string;
  presupuesto?: number;
  gastado?: number;
  beneficio_global?: boolean;
  beneficio?: number;
  comision?: number;
  tiene_comision?: boolean;
  subtotal_costos?: number;
  beneficio_costos?: number;
  total_con_beneficio?: number;
  comision_monto?: number;
  beneficio_neto?: number;
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

export type EstadoPago = RecordOption;

export interface ObraCosto {
  id?: number;
  id_obra: number;
  item_numero?: string;
  id_proveedor?: number;
  proveedor?: Proveedor;
  tipo_costo?: 'ORIGINAL' | 'ADICIONAL';
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  iva?: number;
  beneficio?: number;
  estado_pago?: string;
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
  obraNombre: string;
  proveedor?: Proveedor;
  estado_tarea: string;
  nombre: string;
  descripcion?: string;
  porcentaje?: number;
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
  tipo_transaccion: string;
  fecha?: string | Date;
  monto: number;
  forma_pago: string; // PARCIAL | TOTAL
  medio_pago?: string; // efectivo, transferencia, cheque, etc.
  factura_cobrada?: boolean;
  saldo_cliente?: number;
  saldo_proveedor?: number;
  tipo_movimiento?: string;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
  observacion?: string;
  etiqueta?: string; // auxiliar de UI (FC/RBOS)
}

export type TipoDocumento = RecordOption;

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

export interface CuentaCorrienteMovimiento {
  fecha: string;
  obraId?: number;
  obraNombre?: string;
  concepto?: string;
  referencia?: string;
  tipo: string;
  monto: number;
  asociadoTipo?: string;
  asociadoId?: number;
  cobrosAcumulados?: number;
  costosAcumulados?: number;
  pagosAcumulados?: number;
  saldoCliente?: number;
  saldoProveedor?: number;
}

export interface CuentaCorrienteObraResponse {
  obraId?: number;
  obraNombre?: string;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  movimientos: CuentaCorrienteMovimiento[];
}

export interface CuentaCorrienteProveedorResponse {
  proveedorId?: number;
  proveedorNombre?: string;
  totalCostos: number;
  totalPagos: number;
  saldoFinal: number;
  movimientos: CuentaCorrienteMovimiento[];
}

export interface CuentaCorrienteClienteResponse {
  clienteId?: number;
  clienteNombre?: string;
  totalCobros: number;
  totalCostos: number;
  saldoFinal: number;
  movimientos: CuentaCorrienteMovimiento[];
}

export interface ComisionesResponse {
  totalComision: number;
  totalPagos: number;
  saldo: number;
  detalle: Array<{
    obraId?: number;
    obraNombre?: string;
    monto: number;
    pagos: number;
    saldo: number;
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
  tipo_movimiento?: string;
  monto: number;
  obraId: number;
  obraNombre: string;
  formaPago: string;
  asociadoTipo: string;
  asociadoId: number;
}
