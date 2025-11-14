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

import {EstadoPago, Obra, ObraCosto, Proveedor} from '../../../core/models/models';
import {EstadoPagoService} from '../../../services/estado-pago/estado-pago.service';
import {CostosService} from '../../../services/costos/costos.service';
import {Select} from 'primeng/select';
import {ExportService} from '../../../services/export/export.service';

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
  @Input() obra!: Obra;
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

  constructor(
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private messageService: MessageService,
    private exportService: ExportService
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
    if (!this.obra) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'Necesitamos la información de la obra para generar la cotización.'
      });
      return;
    }
    if (!this.costosFiltrados.length) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin costos',
        detail: 'Agrega ítems al presupuesto antes de exportar.'
      });
      return;
    }

    this.exportService.exportPresupuestoPdf({
      obra: this.obra,
      costos: this.costosFiltrados,
      subtotal: this.calcularTotal(),
      total: this.getPresupuestoTotal()
    });

    this.messageService.add({
      severity: 'success',
      summary: 'PDF generado',
      detail: 'La cotización se exportó con el formato de Meliquina.'
    });
  }

  private inicializarCostos() {
    console.log(this.costos)
    this.costosFiltrados = this.costos.map((c) => ({
      ...c,
      precio_unitario: c.precio_unitario ?? 0,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      beneficio: c.beneficio ?? 0,
      estado_pago: c.estado_pago,
    }));
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

