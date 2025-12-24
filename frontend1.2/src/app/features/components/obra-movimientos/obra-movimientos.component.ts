import {Component, Input, OnInit} from '@angular/core';
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

  transacciones: Transaccion[] = [];
  tiposTransaccion: { label: string; name: string }[] = [];

  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  selectedCosto: ObraCosto | null = null;
  pendingCostoId: number | null = null;
  filteredProveedores: Proveedor[] = [];
  filteredClientes: Cliente[] = [];
  costosObra: ObraCosto[] = [];
  costosProveedor: ObraCosto[] = [];
  showAddMovementModal = false;
  modoEdicion = false;

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
    this.modoEdicion = !!movimiento;
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.selectedCosto = null;
    this.pendingCostoId = null;

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
        this.actualizarCostosProveedor();
        const idCosto = (movimiento as any)?.id_costo ?? movimiento.id_costo;
        if (idCosto) {
          this.pendingCostoId = Number(idCosto);
          this.selectedCosto = this.costosProveedor.find(c => Number(c.id) === Number(idCosto)) || null;
          if (this.selectedCosto) {
            this.aplicarFormaPagoDesdeCosto(this.selectedCosto);
          }
        }
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
      }
    }
    this.showAddMovementModal = true;
  }

  onTipoEntidadChange() {
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.selectedCosto = null;
    this.pendingCostoId = null;
    this.costosProveedor = [];
    this.asegurarTipoTransaccionSegunAsociado();
  }

  onProveedorSeleccionado() {
    this.actualizarCostosProveedor();
  }

  onCostoSeleccionado(costo: ObraCosto | null) {
    this.selectedCosto = costo;
    if (costo) {
      this.aplicarFormaPagoDesdeCosto(costo);
    }
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

    if (!this.validarMontoContraCosto()) {
      return;
    }

    const mov: any = {
      ...this.nuevoMovimiento,
      id_obra: this.obraId,
      tipo_transaccion: this.nuevoMovimiento.tipo_transaccion,
      id_asociado: asociadoId,
      id_costo: this.selectedCosto?.id ?? undefined,
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
        this.actualizarEstadoCostoAsociado(movGuardado, this.selectedCosto);
        if (this.modoEdicion) {
          this.transacciones = this.transacciones.map(t =>
            t.id === movGuardado.id ? movGuardado : t
          );
        } else {
          this.transacciones = [movGuardado, ...this.transacciones];
        }

        if (this.selectedCosto?.id) {
          this.refrescarCostosObra();
        }

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

  private actualizarCostosProveedor() {
    if (this.tipoEntidad !== 'PROVEEDOR' || !this.selectedProveedor) {
      this.costosProveedor = [];
      this.selectedCosto = null;
      return;
    }
    const proveedorId = Number(this.selectedProveedor.id);
    this.costosProveedor = (this.costosObra || []).filter(c =>
      Number(c.id_proveedor) === proveedorId &&
      (c.estado_pago || "").toString().toUpperCase() !== "PAGADO"
    );
    if (this.pendingCostoId && !this.selectedCosto) {
      this.selectedCosto = this.costosProveedor.find(c => Number(c.id) === Number(this.pendingCostoId)) || null;
      if (this.selectedCosto) {
        this.aplicarFormaPagoDesdeCosto(this.selectedCosto);
        this.pendingCostoId = null;
      }
    }
    if (this.selectedCosto && Number(this.selectedCosto.id_proveedor) !== proveedorId) {
      this.selectedCosto = null;
    }
    if (this.selectedCosto && (this.selectedCosto.estado_pago || "").toString().toUpperCase() === "PAGADO") {
      this.selectedCosto = null;
    }
  }

  private aplicarFormaPagoDesdeCosto(costo: ObraCosto) {
    const estado = (costo.estado_pago || '').toString().toUpperCase();
    if (estado === 'PARCIAL') {
      this.nuevoMovimiento.forma_pago = 'PARCIAL';
      return;
    }
    if (estado === 'PAGADO') {
      this.nuevoMovimiento.forma_pago = 'TOTAL';
    }
  }

  private actualizarEstadoCostoAsociado(mov: Transaccion, costo: ObraCosto | null) {
    if (!costo?.id) return;
    if (this.tipoValue(mov) === 'COBRO') return;

    const formaPago = (mov.forma_pago || '').toString().toUpperCase();
    const monto = Number(mov.monto ?? 0);
    const totalCosto = Number(costo.total ?? 0);
    const diferencia = Math.abs(monto - totalCosto);

    let nuevoEstado: string | null = null;
    if (formaPago === 'PARCIAL' && monto < totalCosto) {
      nuevoEstado = 'PARCIAL';
    }
    if (formaPago === 'TOTAL' && diferencia < 0.01) {
      nuevoEstado = 'PAGADO';
    }

    if (!nuevoEstado || (costo.estado_pago || '').toString().toUpperCase() === nuevoEstado) {
      return;
    }

    this.costosService.updateEstadoPago(costo.id, nuevoEstado).subscribe({
      next: () => {
        costo.estado_pago = nuevoEstado;
      }
    });
  }

  private validarMontoContraCosto(): boolean {
    if (!this.selectedCosto?.id) return true;
    if (this.tipoEntidad !== 'PROVEEDOR') return true;

    const formaPago = (this.nuevoMovimiento.forma_pago || '').toString().toUpperCase();
    const monto = Number(this.nuevoMovimiento.monto ?? 0);
    const totalCosto = Number(this.selectedCosto.total ?? 0);
    const diferencia = Math.abs(monto - totalCosto);

    if (formaPago === 'TOTAL' && diferencia >= 0.01) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para pago total, el monto debe ser igual al total del costo.'
      });
      return false;
    }

    if (formaPago === 'PARCIAL' && monto >= totalCosto) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto invalido',
        detail: 'Para pago parcial, el monto debe ser menor al total del costo.'
      });
      return false;
    }

    return true;
  }

  private asegurarTipoTransaccionSegunAsociado() {
    const requerido = this.tipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
    this.nuevoMovimiento.tipo_transaccion = requerido;
  }

  private refrescarCostosObra() {
    this.costosService.getByObra(this.obraId).subscribe(costos => {
      this.costosObra = costos || [];
      this.actualizarCostosProveedor();
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
}



