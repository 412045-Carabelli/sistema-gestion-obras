// ===== AUTH TYPES & INTERFACES =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  empresaNombre: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  email: string;
  username: string;
  rol: string;
  nombre?: string;
  apellido?: string;
  organizacion_id: number | null;
}

export interface UserInfo {
  userId: number;
  email: string;
  username: string;
  rol: string;
  nombre?: string;
  apellido?: string;
  organizacionId: number | null;
}

export interface UpdatePerfilRequest {
  nombre: string;
  apellido: string;
  email: string;
}

export interface UpdateUsuarioOrganizacionRequest {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export interface CreateUsuarioOrganizacionRequest {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  rol: string;
}

export interface UsuarioInfoResponse {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol: string;
  activo: boolean;
  creado_en?: string;
}

// ===== BUSINESS TYPES & INTERFACES =====
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
  totalCliente?: number;
  cobrosRealizados?: number;
  saldoCliente?: number;
  obras?: Obra[];
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
  totalProveedor?: number;
  pagosRealizados?: number;
  saldoProveedor?: number;
}

export type EstadoObra = RecordOption;

export type EstadoTarea = RecordOption;

export type TipoTransaccion = RecordOption;

export interface GrupoObra {
  id?: number;
  id_cliente: number;
  nombre: string;
  activo?: boolean;
  creado_en?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
}

export interface Obra {
  id?: number;
  id_cliente?: number;
  id_grupo?: number;
  cliente: Cliente;
  grupo?: GrupoObra;
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
  memoria_descriptiva?: string;
  condiciones_presupuesto?: string;
  observaciones_presupuesto?: string;
  requiere_factura?: boolean;
  estado_financiero?: string;
  subtotal_costos?: number;
  beneficio_costos?: number;
  total_con_beneficio?: number;
  comision_monto?: number;
  beneficio_neto?: number;
  economia_obra?: number;
  demasia_obra?: number;
  desvio_total?: number;
  activo?: boolean;
  creado_en?: string;
  notas?: string;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
  tareas?: Tarea[];
  costos?: ObraCosto[];
  saldo_pendiente?: number;
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
  tipo_costo?: 'ORIGINAL' | 'ADICIONAL' | 'AJUSTE';
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  iva?: number;
  beneficio?: number;
  estado_pago?: string;
  subtotal: number;
  total: number;
  monto_real?: number;
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
  numero_orden?: number;
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

export interface TareaAntiguaAgenda {
  id: number;
  titulo: string;
  obraId?: number;
  obraNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  estado: string;
  descripcion?: string;
  fechaVencimiento?: string;
  creadoEn?: string;
  ultimaActualizacion?: string;
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
  concepto?: string; // concepto o detalle del movimiento (opcional)
  factura_cobrada?: boolean;
  saldo_cliente?: number;
  saldo_proveedor?: number;
  pagado?: number;
  restante?: number;
  tipo_movimiento?: string;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
  observacion?: string;
  etiqueta?: string; // auxiliar de UI (FC/RBOS)
}

export interface Factura {
  id?: number;
  id_cliente: number;
  id_obra?: number;
  cliente_nombre?: string;
  obra_nombre?: string;
  monto: number;
  monto_restante: number;
  fecha?: string;
  descripcion?: string;
  estado?: string;
  nombre_archivo?: string;
  path_archivo?: string;
  activo?: boolean;
  impacta_cta_cte?: boolean;
  id_transaccion?: number;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
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
  grupoId?: number;
  obraId?: number;
  obraIds?: number[];
  clienteId?: number;
  proveedorId?: number;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
}

export interface DashboardFinancieroResponse {
  ctaCte: {
    loCobrado: number;
    porCobrar: number;
    pagado: number;
    porPagar: number;
  };
  flujo: {
    ingresos: number;
    egresos: number;
    saldo: number;
  };
}

export interface DashboardGraficosResponse {
  distribucionEstados: {
    estado: string;
    cantidad: number;
    porcentaje: number;
  }[];
  topObras: {
    obraId: number;
    obraNombre: string;
    presupuesto: number;
    totalCobros: number;
    totalPagos: number;
  }[];
  kpis: {
    totalObras: number;
    obrasActivas: number;
    presupuestoTotal: number;
    porcentajeCobroGlobal: number;
  };
}

export interface DashboardConsolidadoResponse {
  totalPresupuesto: number;
  totalCostos: number;
  porPresupuestar: number;
  totalCobros: number;
  totalPagos: number;
  saldoFlujo: number;
  porCobrar: number;
  porPagar: number;
  cuentaCorriente: {
    loCobrado: number;
    porCobrar: number;
    pagado: number;
    porPagar: number;
  };
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
    tipo_movimiento?: string;
    detalle?: string;
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
  proveedorId?: number;
  proveedorNombre?: string;
  asociadoTipo?: string;
  asociadoId?: number;
  cobrosAcumulados?: number;
  costosAcumulados?: number;
  pagosAcumulados?: number;
  saldoCliente?: number;
  saldoProveedor?: number;
}

export interface DetalleDeudaCliente {
  grupoId?: number;
  grupoNombre?: string;
  obraId: number;
  obraNombre: string;
  clienteId?: number;
  clienteNombre?: string;
  presupuesto: number;
  cobrado: number;
  saldo: number;
}

export interface DetalleDeudaProveedor {
  grupoId?: number;
  grupoNombre?: string;
  obraId: number;
  obraNombre: string;
  proveedorId: number;
  proveedorNombre: string;
  presupuestado: number;
  pagado: number;
  saldo: number;
}

export interface ResumenCuentaCliente {
  clienteId: number;
  clienteNombre: string;
  presupuestado: number;
  cobros: number;
  saldo: number;
}

export interface ResumenCuentaProveedor {
  proveedorId: number;
  proveedorNombre: string;
  presupuestado: number;
  pagos: number;
  saldo: number;
}

export interface DeudasGlobalesResponse {
  deudaClientes: number;
  deudaProveedores: number;
  detalleDeudaClientes: DetalleDeudaCliente[];
  detalleDeudaProveedores: DetalleDeudaProveedor[];
}

export interface FacturasKpiResponse {
  totalFacturado: number;
  totalPorFacturar: number;
  totalCobrado: number;
  totalPorCobrar: number;
}

export interface CuentaCorrienteObraResponse {
  obraId?: number;
  obraNombre?: string;
  presupuestado?: number;
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
  resumenProveedores?: ResumenCuentaProveedor[];
}

export interface CuentaCorrienteClienteResponse {
  clienteId?: number;
  clienteNombre?: string;
  totalCobros: number;
  totalCostos: number;
  saldoFinal: number;
  movimientos: CuentaCorrienteMovimiento[];
  resumenClientes?: ResumenCuentaCliente[];
}

export interface CuentaCorrientePdfResponse {
  asociadoId: number;
  asociadoNombre: string;
  asociadoEmail?: string;
  asociadoTelefono?: string;
  totalCostos: number;
  totalPagos: number;
  saldoFinal: number;
  fechasUnicas: string[];
  filas: CuentaCorrientePdfFila[];
}

export interface CuentaCorrientePdfFila {
  obraId: number;
  obraNombre: string;
  movimientosPorFecha: Record<string, number>;
  saldoObra?: number;
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
    fecha?: string;
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

export type EstadoAgenda = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

export const ESTADOS_AGENDA_OPCIONES: RecordOption[] = [
  {label: 'Pendiente', name: 'PENDIENTE'},
  {label: 'En Progreso', name: 'EN_PROGRESO'},
  {label: 'Completada', name: 'COMPLETADA'}
];

export interface Agenda {
  id?: number;
  titulo: string;
  obraId?: number;
  clienteId?: number;
  proveedorId?: number;
  estado: EstadoAgenda;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  descripcion?: string;
  fechaInicio?: string;
  fechaVencimiento?: string;
  creadoEn?: string;
  ultimaActualizacion?: string;
}

export const PRIORIDADES_AGENDA: { label: string; value: string }[] = [
  { label: 'Alta', value: 'ALTA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Baja', value: 'BAJA' }
];

export interface MovimientoRecenteDTO {
  id: number;
  obraId: number;
  obraNombre: string;
  asociadoId: number;
  asociadoTipo: string;
  asociadoNombre: string;
  tipoTransaccion: string;
  tipo_movimiento?: string; // alias para compatibilidad con template
  tipo?: string; // alias para compatibilidad con template
  fecha: string;
  monto: number;
  formaPago: string;
  medioPago: string;
  concepto: string;
}

export interface ObraSaldoItem {
  obraId: number;
  nombre: string;
  estado: string;
  presupuestado: number;
  cobrado?: number;
  pagado?: number;
  saldo: number;
}

export interface SaldosClienteResponse {
  clienteId: number;
  clienteNombre: string;
  totalPresupuestado: number;
  totalCobrado: number;
  saldo: number;
  obras: ObraSaldoItem[];
}

export interface SaldosProveedorResponse {
  proveedorId: number;
  proveedorNombre: string;
  totalCostos: number;
  totalPagado: number;
  saldo: number;
  obras: ObraSaldoItem[];
}

export interface DashboardCuentaCorrienteResponse {
  cobrado: number;
  porCobrar: number;
  pagado: number;
  porPagar: number;
  resultado: number;
}

export interface SaldoGrupoCliente {
  id_grupo: number;
  nombre_grupo: string;
  id_cliente: number;
  nombre_cliente: string;
  total_presupuesto: number;
  total_cobros: number;
  saldo_pendiente: number;
}

export interface SaldoGrupoProveedor {
  id_grupo: number;
  nombre_grupo: string;
  id_proveedor: number;
  nombre_proveedor: string;
  total_costos: number;
  total_pagos: number;
  saldo_pendiente: number;
}

export interface ResumenObraCliente {
  id_cliente: number;
  nombre_cliente: string;
  id_obra: number;
  nombre_obra: string;
  presupuestado: number;
  cobros_realizados: number;
  saldo: number;
}

export interface ResumenObraProveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  id_obra: number;
  nombre_obra: string;
  costos: number;
  pagos_realizados: number;
  saldo: number;
}

export interface CatalogoCuentaCorriente {
  grupos: Array<{ id: number; nombre: string }>;
  obras: Array<{ id: number; nombre: string }>;
  clientes: Array<{ id: number; nombre: string }>;
  proveedores: Array<{ id: number; nombre: string }>;
}

export interface Movimiento {
  id: number;
  id_obra: number;
  id_asociado: number;
  tipo_asociado: string; // CLIENTE, PROVEEDOR
  nombre_asociado?: string;
  tipo_transaccion: string; // COBRO, PAGO
  fecha: string;
  monto: number;
  forma_pago: string; // PARCIAL, TOTAL
  medio_pago?: string; // Transferencia, Efectivo, Cheque, etc.
  concepto?: string;
  factura_cobrada?: boolean;
  activo?: boolean;
  ultima_actualizacion?: string;
  tipo_actualizacion?: string;
  pagado?: number;
  restante?: number;
}
