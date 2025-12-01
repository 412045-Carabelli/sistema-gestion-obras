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
import {Cliente, Proveedor, Transaccion} from '../../../core/models/models';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {Select} from 'primeng/select';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Toast} from 'primeng/toast';
import {AutoComplete} from 'primeng/autocomplete';
import {TagModule} from 'primeng/tag';
import {CheckboxModule} from 'primeng/checkbox';
import {InputText} from 'primeng/inputtext';

@Component({
  selector: 'app-obra-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe, DatePipe, TableModule, ButtonModule,
    TooltipModule, DropdownModule, FormsModule,
    ModalComponent, InputNumber, DatePicker,
    FileUploadModule, NgClass, Select, ConfirmDialog, Toast, AutoComplete, TagModule, CheckboxModule, InputText
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

  parcial_o_total_options = [
    {label: 'Parcial', name: 'PARCIAL'},
    {label: 'Total', name: 'TOTAL'}
  ];
  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  filteredProveedores: Proveedor[] = [];
  filteredClientes: Cliente[] = [];
  showAddMovementModal = false;
  modoEdicion = false;

  nuevoMovimiento: Transaccion = {
    id_obra: this.obraId,
    tipo_transaccion: 'COBRO',
    fecha: new Date().toISOString().split('T')[0],
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
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
  }

  filtrarProveedores(event: any) {
    const query = event.query.toLowerCase();
    this.filteredProveedores = this.proveedores.filter(p =>
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
    return "No se encontrÃ³ un cliente/proveedor asociado"
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
      this.transacciones = transacciones.map(t => ({
        ...t,
        etiqueta: this.tipoValue(t) === 'COBRO' ? 'FC' : 'RBOS'
      }));
    });

    this.transaccionesService.getTipos().subscribe(tipos => {
      this.tiposTransaccion = tipos;
    });
  }

  openModal(movimiento?: Transaccion) {
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
    } else {
      this.nuevoMovimiento = {
        id_obra: this.obraId,
        tipo_transaccion: 'COBRO',
        fecha: new Date().toISOString().split('T')[0],
        monto: 0,
        forma_pago: 'TOTAL',
        medio_pago: 'Transferencia',
        factura_cobrada: false,
        activo: true,
        tipo_asociado: 'CLIENTE'
      };
      // Si solo hay un cliente (el de la obra), seleccionarlo por defecto
      if (this.clientes && this.clientes.length === 1) {
        this.selectedCliente = this.clientes[0];
      }
    }
    this.showAddMovementModal = true;
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
      next: () => {
        this.cargarDatos();
        this.showAddMovementModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
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
      header: 'Confirmar eliminaciÃ³n',
      message: `Â¿EstÃ¡s seguro de que deseas eliminar este movimiento de $${t.monto}?`,
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
    const tipo = rawTipo.toString().toUpperCase();
    if (tipo.includes('FACT')) return 'FACTURA';
    const base = this.tipoValue(t);
    if (base === 'COBRO') return 'INGRESO';
    if (base === 'PAGO') return 'EGRESO';
    return tipo || 'â€”';
  }

  movimientoEsFactura(t: Transaccion): boolean {
    const tipo = (t as any).tipo_movimiento || t.tipo_transaccion || '';
    return tipo.toString().toUpperCase().includes('FACT');
  }

}



