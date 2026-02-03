import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe, NgClass} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';
import {FileUploadModule} from 'primeng/fileupload';
import {Cliente, ObraCosto, Proveedor, Transaccion} from '../../../core/models/models';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {Select} from 'primeng/select';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Toast} from 'primeng/toast';
import {AutoComplete} from 'primeng/autocomplete';
import {TagModule} from 'primeng/tag';
import {CheckboxModule} from 'primeng/checkbox';
import {InputText} from 'primeng/inputtext';
import {RadioButtonModule} from 'primeng/radiobutton';
import {CostosService} from '../../../services/costos/costos.service';

@Component({
  selector: 'app-obra-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe, DatePipe, TableModule, ButtonModule,
    TooltipModule, DropdownModule, FormsModule,
    ModalComponent, InputNumber, DatePicker,
    FileUploadModule, NgClass, Select, ConfirmDialog, Toast, AutoComplete, TagModule, CheckboxModule, InputText,
    RadioButtonModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obra-movimientos.component.html'
})
export class ObraMovimientosComponent implements OnInit {
  @Input() obraId!: number;
  @Input() clientes!: Cliente[];
  @Input() proveedores!: Proveedor[];
  @Input() obraNombre = '';
  @Input() obraEstado?: string | null;
  @Input() presupuestoTotal?: number;
  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();

  transacciones: Transaccion[] = [];
  tiposTransaccion: { label: string; name: string }[] = [];

  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  filteredProveedores: Proveedor[] = [];
  filteredClientes: Cliente[] = [];
  costosObra: ObraCosto[] = [];
  showAddMovementModal = false;
  modoEdicion = false;
  showDetalleMovimientoModal = false;
  movimientoDetalle?: Transaccion;

  nuevoMovimiento: Transaccion = {
    id_obra: this.obraId,
    tipo_transaccion: 'COBRO',
    fecha: new Date(),
    monto: 0,
    forma_pago: 'TOTAL',
    medio_pago: 'Transferencia',
    factura_cobrada: false,
    activo: true,
    id_asociado: undefined,
    tipo_asociado: 'CLIENTE'
  };

  constructor(
    private transaccionesService: TransaccionesService,
    private costosService: CostosService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
  }

  filtrarProveedores(event: any) {
    const query = (event?.query || '').toLowerCase();
    const proveedoresObra = this.proveedoresDeObra();
    this.filteredProveedores = proveedoresObra.filter(p =>
      p.nombre.toLowerCase().includes(query)
    );
  }

  filtrarClientes(event: any) {
    const query = event.query.toLowerCase();
    this.filteredClientes = this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(query)
    );
  }

  protected proveedorOCliente(id: number, tipoAsociado: string) {
    if(tipoAsociado === 'CLIENTE'){
      return this.clientes.find(c => c.id === id)?.nombre
    }
    if(tipoAsociado === 'PROVEEDOR'){
      return this.proveedores.find(c => c.id === id)?.nombre
    }
    return "No se encontró un cliente/proveedor asociado"
  }

  get totalCobros(): number {
    return this.transacciones
      .filter(t => this.tipoValue(t) === 'COBRO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get totalPagos(): number {
    return this.transacciones
      .filter(t => this.tipoValue(t) === 'PAGO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get totalCliente(): number {
    return Number(this.presupuestoTotal ?? 0);
  }

  get totalProveedores(): number {
    return (this.costosObra || []).reduce((acc, c) => {
      if (!this.costoTieneProveedor(c)) return acc;
      return acc + this.getMontoBaseCosto(c);
    }, 0);
  }

  get saldoClienteResumen(): number {
    return this.totalCliente - this.totalCobros;
  }

  get saldoProveedorResumen(): number {
    return this.totalProveedores - this.totalPagos;
  }

  get saldo(): number {
    return this.totalCobros - this.totalPagos;
  }

  get saldoCliente(): number {
    const ingresosCliente = this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'CLIENTE')
      .filter(t => this.tipoValue(t) === 'COBRO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
    const egresosCliente = this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'CLIENTE')
      .filter(t => this.tipoValue(t) === 'PAGO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
    return ingresosCliente - egresosCliente;
  }

  get saldoProveedor(): number {
    const ingresosProveedor = this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'PROVEEDOR')
      .filter(t => this.tipoValue(t) === 'COBRO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
    const egresosProveedor = this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'PROVEEDOR')
      .filter(t => this.tipoValue(t) === 'PAGO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
    return ingresosProveedor - egresosProveedor;
  }

  get totalCobrosClienteSeleccionado(): number {
    if (!this.selectedCliente?.id) return 0;
    return this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'CLIENTE')
      .filter(t => Number(t.id_asociado) === Number(this.selectedCliente?.id))
      .filter(t => this.tipoValue(t) === 'COBRO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get totalClienteSeleccionado(): number | null {
    if (!this.selectedCliente?.id) return null;
    if (this.presupuestoTotal == null) return null;
    return Number(this.presupuestoTotal ?? 0);
  }

  get deudaClienteSeleccionado(): number | null {
    if (!this.selectedCliente?.id) return null;
    if (this.presupuestoTotal == null) return null;
    const deuda = Number(this.presupuestoTotal ?? 0) - this.totalCobrosClienteSeleccionado;
    return Math.max(0, deuda);
  }

  get totalProveedorSeleccionado(): number | null {
    if (!this.selectedProveedor?.id) return null;
    return (this.costosObra || []).reduce((acc, costo) => {
      const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
      if (id !== Number(this.selectedProveedor?.id)) return acc;
      return acc + this.getMontoBaseCosto(costo);
    }, 0);
  }

  get pagadoProveedorSeleccionado(): number | null {
    if (!this.selectedProveedor?.id) return null;
    return this.transacciones
      .filter(t => (t.tipo_asociado || '').toUpperCase() === 'PROVEEDOR')
      .filter(t => Number(t.id_asociado) === Number(this.selectedProveedor?.id))
      .filter(t => this.tipoValue(t) === 'PAGO')
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get saldoProveedorSeleccionado(): number | null {
    if (!this.selectedProveedor?.id) return null;
    const total = this.totalProveedorSeleccionado ?? 0;
    const pagado = this.pagadoProveedorSeleccionado ?? 0;
    return Math.max(0, total - pagado);
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.transaccionesService.getByObra(this.obraId).subscribe(transacciones => {
      this.transacciones = transacciones.map(t => this.normalizarTransaccion(t));
    });

    this.transaccionesService.getTipos().subscribe(tipos => {
      this.tiposTransaccion = tipos;
    });

    this.refrescarCostosObra();
  }

  openModal(movimiento?: Transaccion) {
    if (!movimiento && !this.estadoPermiteMovimientos()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Estado invalido',
        detail: 'La obra debe estar Adjudicada, En progreso o Finalizada para crear movimientos.'
      });
      return;
    }
    this.modoEdicion = !!movimiento;
    this.selectedCliente = null;
    this.selectedProveedor = null;

    const tipoAsociado = (movimiento?.tipo_asociado || 'CLIENTE').toUpperCase() as 'CLIENTE' | 'PROVEEDOR';
    this.tipoEntidad = tipoAsociado;

    if (movimiento) {
      this.nuevoMovimiento = {
        ...movimiento,
        fecha: movimiento.fecha ? new Date(movimiento.fecha) : new Date(),
        factura_cobrada: !!movimiento.factura_cobrada
      };
      if (tipoAsociado === 'CLIENTE' && movimiento.id_asociado) {
        this.selectedCliente = this.clientes.find(c => Number(c.id) === Number(movimiento.id_asociado)) || null;
      }
      if (tipoAsociado === 'PROVEEDOR' && movimiento.id_asociado) {
        this.selectedProveedor = this.proveedores.find(p => Number(p.id) === Number(movimiento.id_asociado)) || null;
      }
      this.asegurarTipoTransaccionSegunAsociado();
    } else {
      this.nuevoMovimiento = {
        id_obra: this.obraId,
        tipo_transaccion: 'COBRO',
        fecha: new Date(),
        monto: 0,
        forma_pago: 'TOTAL',
        medio_pago: 'Transferencia',
        factura_cobrada: false,
        activo: true,
        tipo_asociado: 'CLIENTE'
      };
      this.asegurarTipoTransaccionSegunAsociado();
      // Si solo hay un cliente (el de la obra), seleccionarlo por defecto
      if (this.clientes && this.clientes.length === 1) {
        this.selectedCliente = this.clientes[0];
        this.aplicarMontoClienteSeleccionado();
      }
    }
    this.showAddMovementModal = true;
  }

  onTipoEntidadChange() {
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.asegurarTipoTransaccionSegunAsociado();
  }

  abrirDetalleMovimiento(movimiento: Transaccion) {
    if (!movimiento) return;
    this.movimientoDetalle = movimiento;
    this.showDetalleMovimientoModal = true;
  }

  cerrarDetalleMovimiento() {
    this.showDetalleMovimientoModal = false;
  }

  editarDetalleMovimiento() {
    if (!this.movimientoDetalle) return;
    this.cerrarDetalleMovimiento();
    this.openModal(this.movimientoDetalle);
  }

  onClienteSeleccionado() {
    this.cargarDatos();
    this.aplicarMontoClienteSeleccionado();
  }

  onProveedorSeleccionado() {
    if (!this.selectedProveedor) return;
    this.aplicarMontoProveedorSeleccionado();
  }

  onFormaPagoChange(value: 'TOTAL' | 'PARCIAL') {
    if (value === 'PARCIAL') {
      this.nuevoMovimiento.monto = 0;
      return;
    }
    if (this.tipoEntidad === 'CLIENTE') {
      this.aplicarMontoClienteSeleccionado();
      return;
    }
    if (this.tipoEntidad === 'PROVEEDOR') {
      this.aplicarMontoProveedorSeleccionado();
    }
  }

  onMontoChange(value: any) {
    const monto = Number(value ?? this.nuevoMovimiento.monto ?? 0);
    if (!Number.isFinite(monto) || monto < 0) return;
    this.nuevoMovimiento.monto = monto;
    this.ajustarFormaPagoSegunMonto(monto);
  }

  getTiposTransaccionDisponibles() {
    const requerido = this.tipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
    const filtrados = (this.tiposTransaccion || []).filter(t => (t.name || '').toUpperCase() === requerido);
    if (filtrados.length > 0) return filtrados;
    return [{ label: requerido === 'PAGO' ? 'Pago' : 'Cobro', name: requerido }];
  }

  getTipoTransaccionDisponibleLabel(): string {
    const opciones = this.getTiposTransaccionDisponibles();
    if (opciones.length === 0) return '';
    const opcion = opciones[0];
    return opcion.label || opcion.name || '';
  }

  getTipoTransaccionSeverity(): 'success' | 'danger' | 'info' {
    const opciones = this.getTiposTransaccionDisponibles();
    const name = (opciones[0]?.name || '').toString().toUpperCase();
    if (name === 'COBRO') return 'success';
    if (name === 'PAGO') return 'danger';
    return 'info';
  }

  cerrarModal() {
    this.showAddMovementModal = false;
  }

  guardarMovimiento() {
    if (!this.modoEdicion && !this.estadoPermiteMovimientos()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Estado invalido',
        detail: 'La obra debe estar Adjudicada, En progreso o Finalizada para crear movimientos.'
      });
      return;
    }
    // Determinar asociado segun seleccion
    const asociadoId = this.tipoEntidad === 'PROVEEDOR' ? this.selectedProveedor?.id : this.selectedCliente?.id;
    if (!asociadoId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta asociado',
        detail: `Selecciona un ${this.tipoEntidad.toLowerCase()}`
      });
      return;
    }

    if (!this.validarMontoContraPresupuesto()) {
      return;
    }

    const mov: any = {
      ...this.nuevoMovimiento,
      id_obra: this.obraId,
      tipo_transaccion: this.nuevoMovimiento.tipo_transaccion,
      id_asociado: asociadoId,
      tipo_asociado: this.tipoEntidad,
      factura_cobrada: !!this.nuevoMovimiento.factura_cobrada
    };

    if (mov.fecha instanceof Date) {
      mov.fecha = mov.fecha.toISOString().split('T')[0];
    }

    const action = this.modoEdicion
      ? this.transaccionesService.update(mov.id!, mov)
      : this.transaccionesService.create(mov);

    action.subscribe({
      next: (resp) => {
        const movGuardado = this.normalizarTransaccion(resp);
        if (this.modoEdicion) {
          this.transacciones = this.transacciones.map(t =>
            t.id === movGuardado.id ? movGuardado : t
          );
        } else {
          this.transacciones = [movGuardado, ...this.transacciones];
        }

        this.refrescarCostosObra();

        this.showAddMovementModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Movimiento creado con éxito',
          detail: this.modoEdicion ? 'Movimiento actualizado' : 'Movimiento creado'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el movimiento'
        });
      }
    });
  }

  eliminarMovimiento(t: Transaccion) {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar este movimiento de $${t.monto}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.transaccionesService.delete(t.id!).subscribe({
          next: () => {
            this.cargarDatos();
            if (this.movimientoDetalle?.id === t.id) {
              this.cerrarDetalleMovimiento();
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'El movimiento fue eliminado correctamente.'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el movimiento.'
            });
          }
        });
      }
    });
  }

  eliminarDetalleMovimiento() {
    if (!this.movimientoDetalle) return;
    this.eliminarMovimiento(this.movimientoDetalle);
  }

  verPDF(t: Transaccion) {
    const doc = (t as any).factura || (t as any).recibo;
    if (!doc) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin documento',
        detail: 'No hay documento adjunto.'
      });
      return;
    }
  }

  onUpload(event: any, transaccion: Transaccion) {
    const file = event.files[0];
  }

  private tipoValue(t: Transaccion): 'COBRO' | 'PAGO' | '' {
    const raw: any = (t as any).tipo_transaccion;
    if (typeof raw === 'string') return raw.toUpperCase() as any;
    if (raw && typeof raw.id === 'number') return raw.id === 1 ? 'COBRO' : raw.id === 2 ? 'PAGO' : '';
    const nombre = (raw?.nombre || '').toString().toUpperCase();
    return (nombre.includes('COBRO') ? 'COBRO' : nombre.includes('PAGO') ? 'PAGO' : '') as any;
  }

  tipoMovimiento(t: Transaccion): string {
    const rawTipo = (t as any).tipo_movimiento || t.tipo_transaccion || '';
    const base = this.tipoValue(t);
    if (base === 'COBRO' || base === 'PAGO') return base;
    const tipo = rawTipo.toString().toUpperCase();
    if (tipo.includes('COBRO')) return 'COBRO';
    if (tipo.includes('PAGO')) return 'PAGO';
    return 'MOVIMIENTO';
  }
  movimientoEsFactura(t: Transaccion): boolean {
    const tipo = (t as any).tipo_movimiento || t.tipo_transaccion || '';
    return tipo.toString().toUpperCase().includes('FACT');
  }

  private normalizarTransaccion(t: Transaccion): Transaccion {
    return {
      ...t,
      etiqueta: this.tipoValue(t) === 'COBRO' ? 'FC' : 'RBOS'
    };
  }

  private aplicarMontoClienteSeleccionado() {
    if (!this.selectedCliente || this.presupuestoTotal == null) return;
    if ((this.nuevoMovimiento.forma_pago || '').toString().toUpperCase() === 'PARCIAL') return;
    const deuda = this.deudaClienteSeleccionado;
    if (deuda == null) return;
    this.nuevoMovimiento.monto = deuda;
  }

  private aplicarMontoProveedorSeleccionado() {
    if (!this.selectedProveedor) return;
    if ((this.nuevoMovimiento.forma_pago || '').toString().toUpperCase() === 'PARCIAL') return;
    const saldo = this.saldoProveedorSeleccionado;
    if (saldo == null) return;
    this.nuevoMovimiento.monto = saldo;
  }

  private validarMontoContraPresupuesto(): boolean {
    const formaPago = (this.nuevoMovimiento.forma_pago || '').toString().toUpperCase();
    const monto = Number(this.nuevoMovimiento.monto ?? 0);
    if (formaPago !== 'TOTAL' && formaPago !== 'PARCIAL') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Condicion requerida',
        detail: 'Selecciona si el movimiento es TOTAL o PARCIAL.'
      });
      return false;
    }

    if (this.tipoEntidad === 'CLIENTE') {
      if (this.presupuestoTotal == null) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin presupuesto',
          detail: 'No se pudo obtener el presupuesto total de la obra.'
        });
        return false;
      }
      const presupuesto = Number(this.presupuestoTotal ?? 0);
      const currentId = this.modoEdicion ? Number(this.nuevoMovimiento.id) : null;
      const cobrado = (this.transacciones || [])
        .filter(t => (t.tipo_asociado || '').toUpperCase() === 'CLIENTE')
        .filter(t => Number(t.id_asociado) === Number(this.selectedCliente?.id))
        .filter(t => this.tipoValue(t) === 'COBRO')
        .filter(t => currentId == null || Number(t.id) !== currentId)
        .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
      const restante = Math.max(0, presupuesto - cobrado);
      const diferencia = Math.abs(monto - restante);

      if (monto - restante > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'El monto no puede superar el restante de la obra.'
        });
        return false;
      }

      if (formaPago === 'TOTAL' && diferencia >= 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'Para cobro total, el monto debe ser igual al restante de la obra.'
        });
        return false;
      }

      if (formaPago === 'PARCIAL' && monto >= restante) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'Para cobro parcial, el monto debe ser menor al restante de la obra.'
        });
        return false;
      }

      return true;
    }

    if (this.tipoEntidad === 'PROVEEDOR') {
      if (!this.selectedProveedor?.id) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Proveedor requerido',
          detail: 'Selecciona un proveedor.'
        });
        return false;
      }
      const total = this.totalProveedorSeleccionado ?? 0;
      const pagado = this.pagadoProveedorSeleccionado ?? 0;
      const restante = Math.max(0, total - pagado);
      const diferencia = Math.abs(monto - restante);

      if (monto - restante > 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'El monto no puede superar el saldo del proveedor.'
        });
        return false;
      }

      if (formaPago === 'TOTAL' && diferencia >= 0.01) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'Para pago total, el monto debe ser igual al saldo del proveedor.'
        });
        return false;
      }

      if (formaPago === 'PARCIAL' && monto >= restante) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto invalido',
          detail: 'Para pago parcial, el monto debe ser menor al saldo del proveedor.'
        });
        return false;
      }

      return true;
    }

    return true;
  }

  private ajustarFormaPagoSegunMonto(monto: number) {
    const EPS = 0.01;
    if (this.tipoEntidad === 'CLIENTE') {
      if (this.presupuestoTotal == null) return;
      const currentId = this.modoEdicion ? Number(this.nuevoMovimiento.id) : null;
      const cobrado = (this.transacciones || [])
        .filter(t => (t.tipo_asociado || '').toUpperCase() === 'CLIENTE')
        .filter(t => Number(t.id_asociado) === Number(this.selectedCliente?.id))
        .filter(t => this.tipoValue(t) === 'COBRO')
        .filter(t => currentId == null || Number(t.id) !== currentId)
        .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
      const restante = Math.max(0, Number(this.presupuestoTotal ?? 0) - cobrado);
      if (Math.abs(monto - restante) < EPS) {
        this.nuevoMovimiento.forma_pago = 'TOTAL';
      } else if (monto < restante) {
        this.nuevoMovimiento.forma_pago = 'PARCIAL';
      }
      return;
    }

    if (this.tipoEntidad === 'PROVEEDOR') {
      const total = this.totalProveedorSeleccionado ?? 0;
      const pagado = this.pagadoProveedorSeleccionado ?? 0;
      const restante = Math.max(0, total - pagado);
      if (Math.abs(monto - restante) < EPS) {
        this.nuevoMovimiento.forma_pago = 'TOTAL';
      } else if (monto < restante) {
        this.nuevoMovimiento.forma_pago = 'PARCIAL';
      }
    }
  }

  private asegurarTipoTransaccionSegunAsociado() {
    const requerido = this.tipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
    this.nuevoMovimiento.tipo_transaccion = requerido;
  }

  private getMontoBaseCosto(costo: ObraCosto): number {
    const subtotal = Number(costo.subtotal ?? NaN);
    if (!Number.isNaN(subtotal) && subtotal > 0) return subtotal;
    const cantidad = Number(costo.cantidad ?? NaN);
    const precio = Number(costo.precio_unitario ?? NaN);
    if (!Number.isNaN(cantidad) && !Number.isNaN(precio)) return cantidad * precio;
    return 0;
  }

  private refrescarCostosObra() {
    this.costosService.getByObra(this.obraId).subscribe(costos => {
      this.costosObra = costos || [];
      this.costosActualizados.emit([...this.costosObra]);
    });
  }

  private proveedoresDeObra(): Proveedor[] {
    const ids = new Set<number>();
    (this.costosObra || []).forEach(c => {
      const id = Number((c as any)?.proveedor?.id ?? (c as any)?.id_proveedor ?? 0);
      if (id) ids.add(id);
    });
    return (this.proveedores || []).filter(p => ids.has(Number(p.id)));
  }

  private costoTieneProveedor(costo?: ObraCosto | null): boolean {
    if (!costo) return false;
    const id = Number((costo as any)?.id_proveedor ?? (costo as any)?.proveedor?.id ?? 0);
    return id > 0;
  }

  private estadoPermiteMovimientos(): boolean {
    const raw = (this.obraEstado || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
    return raw === 'ADJUDICADA' || raw === 'EN_PROGRESO' || raw === 'FINALIZADA';
  }
}



