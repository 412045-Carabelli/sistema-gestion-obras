import { Component, Input, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { Transaccion, TipoTransaccion } from '../../../core/models/models';
import { TransaccionesService } from '../../../services/transacciones/transacciones.service';
import { Select } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-obra-movimientos',
  standalone: true,
  imports: [
    CurrencyPipe, DatePipe, TableModule, ButtonModule,
    TooltipModule, DropdownModule, FormsModule,
    ModalComponent, InputNumber, DatePicker,
    FileUploadModule, NgClass, Select, ConfirmDialog, Toast
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obra-movimientos.component.html'
})
export class ObraMovimientosComponent implements OnInit {
  @Input() obraId!: number;

  transacciones: Transaccion[] = [];
  tiposTransaccion: TipoTransaccion[] = [];

  parcial_o_total_options = [
    { label: 'Parcial', value: 'Parcial' },
    { label: 'Total', value: 'Total' }
  ];

  showAddMovementModal = false;
  modoEdicion = false;

  nuevoMovimiento: Transaccion = {
    id_obra: this.obraId,
    tipo_transaccion: { id: 1, nombre: 'Cobro' },
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    forma_pago: 'Total',
    activo: true
  };

  constructor(
    private transaccionesService: TransaccionesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.transaccionesService.getByObra(this.obraId).subscribe(transacciones => {
      this.transacciones = transacciones.map(t => ({
        ...t,
        etiqueta: t.tipo_transaccion?.id === 1 ? 'FC' : 'RBOS'
      }));
    });

    this.transaccionesService.getTipos().subscribe(tipos => {
      this.tiposTransaccion = tipos;
    });
  }

  get totalCobros(): number {
    return this.transacciones
      .filter(t => t.tipo_transaccion?.id === 1)
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get totalPagos(): number {
    return this.transacciones
      .filter(t => t.tipo_transaccion?.id === 2)
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }

  get saldo(): number {
    return this.totalCobros - this.totalPagos;
  }

  openModal(movimiento?: Transaccion) {
    this.modoEdicion = !!movimiento;
    this.nuevoMovimiento = movimiento
      ? { ...movimiento, fecha: movimiento.fecha ? new Date(movimiento.fecha) : new Date() }
      : {
        id_obra: this.obraId,
        tipo_transaccion: this.tiposTransaccion[0] || { id: 1, nombre: 'Cobro' },
        fecha: new Date().toISOString().split('T')[0],
        monto: 0,
        forma_pago: 'Total',
        activo: true
      };
    this.showAddMovementModal = true;
  }

  cerrarModal() {
    this.showAddMovementModal = false;
  }

  guardarMovimiento() {
    const mov: any = {
      ...this.nuevoMovimiento,
      id_obra: this.obraId,
      tipo_transaccion: { id: this.nuevoMovimiento.tipo_transaccion.id }
    };

    // Si la fecha es un objeto Date, convertirla a string ISO
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
    console.log('🧾 Ver documento PDF:', doc.numero);
  }

  onUpload(event: any, transaccion: Transaccion) {
    const file = event.files[0];
    console.log('📎 PDF adjuntado a transacción', transaccion.id, file.name);
  }
}
