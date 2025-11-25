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

import {EstadoPago, ObraCosto, Proveedor} from '../../../core/models/models';
import {EstadoPagoService} from '../../../services/estado-pago/estado-pago.service';
import {CostosService} from '../../../services/costos/costos.service';
import {Select} from 'primeng/select';

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

  // ? NUEVO: Emitir cuando se actualizan los costos
  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();

  costosFiltrados: ObraCosto[] = [];
  estadosPagoRecords: { label: string; name: string }[] = [];
  loading = true;
  nuevoCosto: Partial<ObraCosto> = this.getNuevoCostoBase();

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService
  ) {
  }

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
    const nuevoEstado = this.estadosPagoRecords.find((e) => e.name === nuevoEstadoName);
    if (!nuevoEstado) return;

    this.costosService.updateEstadoPago(c.id!, nuevoEstadoName).subscribe({
      next: (obra) => {
        console.log(obra)
        c.estado_pago = nuevoEstado.name; // El estado completo

        // Actualizar el array de costos original
        const index = this.costos.findIndex(costo => costo.id === c.id);
        if (index !== -1) {
          this.costos[index] = {...this.costos[index], estado_pago: nuevoEstado.name };
        }


        // Emitir el array actualizado
        this.costosActualizados.emit([...this.costos]);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El costo fue marcado como "${nuevoEstado.label}"`,
        });
      },
      error: (err) => {
        console.error('❌ Error al actualizar estado de pago', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de pago',
        });
      }
    });
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

  exportarPDF() {
  }

  private inicializarCostos() {
    console.log(this.costos)
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
        console.error('? Error al cargar estados de pago', err);
        this.loading = false;
        },
    });
  }
}

