import {Component, Input, OnChanges, OnInit, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {DropdownModule} from 'primeng/dropdown';
import {InputTextModule} from 'primeng/inputtext';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';

import {EstadoPago, ObraCosto, Proveedor, Transaccion} from '../../../core/models/models';
import {EstadoPagoService} from '../../../services/estado-pago/estado-pago.service';
import {CostosService} from '../../../services/costos/costos.service';
import {Select} from 'primeng/select';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';

@Component({
  selector: 'app-obra-presupuesto',
  standalone: true,
  imports: [
    CurrencyPipe,
    TableModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    CheckboxModule,
    FormsModule,
    ToastModule,
    NgIf,
    NgClass,
    Select,
    ModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './obra-presupuesto.component.html',
})
export class ObraPresupuestoComponent implements OnInit, OnChanges {
  @Input() obraId!: number;
  @Input() proveedores: Proveedor[] = [];
  @Input() costos: ObraCosto[] = [];

  @Input() usarBeneficioGlobal = false;
  @Input() beneficioGlobal = 0;
  @Input() tieneComision = false;
  @Input() comision = 0;

  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();

  costosFiltrados: ObraCosto[] = [];
  estadosPagoRecords: { label: string; name: string }[] = [];
  loading = true;
  nuevoCosto: Partial<ObraCosto> = this.getNuevoCostoBase();

  modalPagoVisible = false;
  costoPendientePago: ObraCosto | null = null;
  estadoPendientePago: string | null = null;
  transaccionForm: Partial<Transaccion> = {};
  errorApi?: string;

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService,
    private transaccionesService: TransaccionesService
  ) {}

  ngOnInit() {
    if (this.costos?.length > 0) {
      this.inicializarCostos();
    }
    this.cargarEstadosDePago();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costos'] && this.costos?.length > 0) {
      this.inicializarCostos();
    }
    if (changes['beneficioGlobal'] || changes['tieneComision']) {
      this.costosFiltrados = this.costosFiltrados.map(c => ({...c}));
      this.costosFiltrados.forEach(c => this.recalcularEnEdicion(c));
    }
  }

  actualizarEstadoPago(c: ObraCosto, nuevoEstadoName: string) {
    // Reversión a pendiente: borrar movimientos asociados y luego marcar pendiente
    if ((c.estado_pago === 'PAGADO' || c.estado_pago === 'PARCIAL') && nuevoEstadoName === 'PENDIENTE') {
      this.transaccionesService.deleteByCosto(c.id!).subscribe({
        next: () => this.actualizarEstadoPagoDirecto(c, nuevoEstadoName),
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.getErrorMessage(err, 'No se pudo eliminar el movimiento asociado')
          });
        }
      });
      return;
    }

    const requiereMovimiento =
      nuevoEstadoName === 'PAGADO' ||
      nuevoEstadoName === 'PARCIAL';

    if (requiereMovimiento) {
      const forma = nuevoEstadoName === 'PAGADO'
        ? 'TOTAL'
        : nuevoEstadoName === 'PARCIAL'
          ? 'PARCIAL'
          : 'TOTAL';

      this.costoPendientePago = c;
      this.estadoPendientePago = nuevoEstadoName;
      this.errorApi = undefined;
      this.transaccionForm = {
        id_obra: this.obraId,
        id_asociado: c.id_proveedor,
        tipo_asociado: 'PROVEEDOR',
        tipo_transaccion: 'PAGO',
        tipo_movimiento: 'PAGO',
        monto: c.total ?? 0,
        forma_pago: forma,
        fecha: new Date().toISOString().slice(0, 10),
        observacion: ''
      } as any;
      this.modalPagoVisible = true;
      return;
    }

    this.actualizarEstadoPagoDirecto(c, nuevoEstadoName);
  }

  agregarCosto() {
    if (!this.nuevoCosto.descripcion || !this.nuevoCosto.id_proveedor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa proveedor y descripción para agregar el costo.'
      });
      return;
    }

    const payload = this.calcularMontosPayload(this.nuevoCosto);
    this.costosService.createCosto({ ...payload, id_obra: this.obraId }).subscribe({
      next: creado => {
        const actualizado = {...creado, ...payload, enEdicion: false } as ObraCosto;
        this.costosFiltrados = [...this.costosFiltrados, actualizado];
        this.costosActualizados.emit(this.costosFiltrados);
        this.nuevoCosto = this.getNuevoCostoBase();
        this.messageService.add({
          severity: 'success',
          summary: 'Costo agregado',
          detail: 'Se agregó un nuevo costo a la matriz.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el costo.'
        });
      }
    });
  }

  habilitarEdicion(costo: any) {
    costo.enEdicion = true;
  }

  recalcularEnEdicion(costo: any) {
    const { subtotal, total } = this.calcularMontosPayload(costo);
    costo.subtotal = subtotal;
    costo.total = total;
  }

  guardarEdicion(costo: any) {
    const payload = this.calcularMontosPayload(costo);
    this.costosService.updateCosto(costo.id, payload).subscribe({
      next: actualizado => {
        Object.assign(costo, actualizado, payload, { enEdicion: false });
        this.costosActualizados.emit([...this.costosFiltrados]);
        this.messageService.add({
          severity: 'success',
          summary: 'Costo actualizado',
          detail: 'Los cambios se guardaron correctamente.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el costo.'
        });
      }
    });
  }

  eliminarCosto(costo: any) {
    if (!costo.id) return;
    this.costosService.deleteCosto(costo.id).subscribe({
      next: () => {
        this.costosFiltrados = this.costosFiltrados.filter(c => c.id !== costo.id);
        this.costosActualizados.emit(this.costosFiltrados);
        this.messageService.add({
          severity: 'success',
          summary: 'Costo eliminado',
          detail: 'El costo fue eliminado de la matriz.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el costo.'
        });
      }
    });
  }

  confirmarPago() {
    if (!this.costoPendientePago || !this.estadoPendientePago) {
      this.modalPagoVisible = false;
      return;
    }
    this.errorApi = undefined;

    const payload: any = {
      id_obra: this.obraId,
      id_asociado: this.costoPendientePago.id_proveedor,
      tipo_asociado: 'PROVEEDOR',
      tipo_transaccion: this.transaccionForm.tipo_transaccion || 'PAGO',
      tipo_movimiento: this.transaccionForm.tipo_movimiento || 'PAGO',
      monto: this.transaccionForm.monto ?? this.costoPendientePago.total ?? 0,
      forma_pago: this.transaccionForm.forma_pago ?? (this.estadoPendientePago === 'PAGADO' ? 'TOTAL' : this.estadoPendientePago === 'PARCIAL' ? 'PARCIAL' : 'TOTAL'),
      fecha: this.transaccionForm.fecha ?? new Date().toISOString(),
      observacion: this.transaccionForm.observacion ?? '',
      id_costo: this.costoPendientePago.id
    };

    this.transaccionesService.create(payload as any).subscribe({
      next: () => {
        this.modalPagoVisible = false;
        this.actualizarEstadoPagoDirecto(this.costoPendientePago!, this.estadoPendientePago!);
        this.costoPendientePago = null;
        this.estadoPendientePago = null;
      },
      error: (err) => {
        this.errorApi = this.getErrorMessage(err, 'No se pudo registrar la transacción');
      }
    });
  }

  cancelarPago() {
    this.modalPagoVisible = false;
    this.costoPendientePago = null;
    this.estadoPendientePago = null;
  }

  calcularTotal(): number {
    return this.costosFiltrados.reduce((acc, c) => acc + (c.total ?? 0), 0);
  }

  calcularTotalPorEstado(value: string): number {
    return this.costosFiltrados
      .filter((c: any) => (c.estado_pago_value || '').toUpperCase() === (value || '').toUpperCase())
      .reduce((acc: number, c: any) => acc + (c.total ?? 0), 0);
  }

  getPresupuestoTotal(): number {
    const subtotal = this.calcularTotal();
    const beneficio = this.usarBeneficioGlobal ? this.beneficioGlobal : 0;
    const comision = this.tieneComision ? this.comision : 0;
    return Math.round(subtotal * (1 + beneficio / 100) * (1 + comision / 100));
  }

  proveedoresFilter(id: number): Proveedor | undefined {
    return this.proveedores?.find((p) => Number(p.id) === Number(id));
  }

  exportarPDF() {}

  private inicializarCostos() {
    this.costosFiltrados = this.costos.map((c) => ({
      ...c,
      id_proveedor: c.id_proveedor ?? c.proveedor?.id,
      precio_unitario: c.precio_unitario ?? 0,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      beneficio: c.beneficio ?? 0,
      estado_pago: c.estado_pago,
      enEdicion: false,
    }));
  }

  private calcularMontosPayload(costo: Partial<ObraCosto>) {
    const cantidad = Number(costo.cantidad ?? 0);
    const precio = Number(costo.precio_unitario ?? 0);
    const beneficio = this.usarBeneficioGlobal ? this.beneficioGlobal : Number(costo.beneficio ?? 0);

    const subtotal = cantidad * precio;
    const total = subtotal * (1 + (beneficio / 100)) * (1 + (this.tieneComision ? this.comision / 100 : 0));

    return {
      id_proveedor: Number(costo.id_proveedor),
      descripcion: costo.descripcion ?? '',
      unidad: costo.unidad ?? '',
      cantidad,
      precio_unitario: precio,
      beneficio: beneficio,
      subtotal,
      total,
      estado_pago: costo.estado_pago ?? 'PENDIENTE'
    };
  }

  private getNuevoCostoBase(): Partial<ObraCosto> {
    return {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      unidad: '',
      id_proveedor: undefined,
      beneficio: this.usarBeneficioGlobal ? this.beneficioGlobal : 0,
      estado_pago: 'PENDIENTE'
    };
  }

  private cargarEstadosDePago() {
    this.estadoPagoService.getEstadosPago().subscribe({
      next: (records) => {
        this.estadosPagoRecords = records;
        this.loading = false;
        },
      error: (err) => {
        console.error('Error al cargar estados de pago', err);
        this.loading = false;
        },
    });
  }

  private actualizarEstadoPagoDirecto(c: ObraCosto, nuevoEstadoName: string) {
    const nuevoEstado = this.estadosPagoRecords.find((e) => e.name === nuevoEstadoName);
    if (!nuevoEstado) return;

    this.costosService.updateEstadoPago(c.id!, nuevoEstadoName).subscribe({
      next: () => {
        c.estado_pago = nuevoEstado.name;
        const index = this.costos.findIndex(costo => costo.id === c.id);
        if (index !== -1) {
          this.costos[index] = {...this.costos[index], estado_pago: nuevoEstado.name };
        }
        this.costosActualizados.emit([...this.costos]);
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El costo fue marcado como "${nuevoEstado.label}"`,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getErrorMessage(err, 'No se pudo actualizar el estado de pago'),
        });
      }
    });
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (err?.error) {
      return err.error?.error || err.error?.mensaje || err.error?.message || fallback;
    }
    return fallback;
  }
}


