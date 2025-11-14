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

  // ⭐ NUEVO: Emitir cuando se actualizan los costos
  @Output() costosActualizados = new EventEmitter<ObraCosto[]>();

  costosFiltrados: ObraCosto[] = [];
  estadosPago: EstadoPago[] = [];
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

  actualizarEstadoPago(c: ObraCosto, nuevoId: number) {
    const nuevoEstado = this.estadosPago.find((e) => e.id === nuevoId);
    if (!nuevoEstado) return;

    this.costosService.updateEstadoPago(c.id!, nuevoId).subscribe({
      next: () => {
        c.estado_pago = nuevoId;
        c.id_estado_pago = nuevoId;

        // ⭐ ACTUALIZAR EL ARRAY DE COSTOS ORIGINAL
        const index = this.costos.findIndex(costo => costo.id === c.id);
        if (index !== -1) {
          this.costos[index] = {...this.costos[index], estado_pago: nuevoId, id_estado_pago: nuevoId};
        }

        // ⭐ EMITIR EL ARRAY ACTUALIZADO
        this.costosActualizados.emit([...this.costos]);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El costo fue marcado como "${nuevoEstado.estado}"`,
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

  calcularTotalPorEstado(nombreEstado: string): number {
    const estado = this.estadosPago.find(
      (e) => e.estado.toLowerCase() === nombreEstado.toLowerCase()
    );
    if (!estado) return 0;
    return this.costosFiltrados
      .filter((c) => (c.estado_pago ?? c.id_estado_pago) === estado.id)
      .reduce((acc, c) => acc + (c.total ?? 0), 0);
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
    // Aseguramos campos no nulos y un estado de pago por defecto
    this.costosFiltrados = this.costos.map((c) => ({
      ...c,
      precio_unitario: c.precio_unitario ?? 0,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      beneficio: c.beneficio ?? 0,
      estado_pago: (c as any).estado_pago ?? c.id_estado_pago ?? 1,
      id_estado_pago: c.id_estado_pago ?? (c as any).estado_pago ?? 1,
    }));
  }

  private cargarEstadosDePago() {
    this.estadoPagoService.getEstadosPago().subscribe({
      next: (estados) => {
        this.estadosPago = estados.map((e) => ({
          id: e.id,
          estado: e.estado,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar estados de pago', err);
        this.loading = false;
      },
    });
  }
}
