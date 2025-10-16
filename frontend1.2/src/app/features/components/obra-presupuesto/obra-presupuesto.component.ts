import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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

  costosFiltrados: ObraCosto[] = [];
  estadosPago: EstadoPago[] = [];
  loading = true;

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
  }

  actualizarEstadoPago(c: ObraCosto, nuevoId: number) {
    const nuevoEstado = this.estadosPago.find((e) => e.id === nuevoId);
    if (!nuevoEstado) return;

    this.costosService.updateEstadoPago(c.id!, nuevoId).subscribe(() => {
      c.estado_pago = nuevoEstado;
      this.messageService.add({
        severity: 'success',
        summary: 'Estado actualizado',
        detail: `El costo fue marcado como "${nuevoEstado.estado}"`,
      });
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
      .filter((c) => c.estado_pago?.id === estado.id)
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
    console.log('📄 Exportar PDF con costos:', this.costosFiltrados);
  }

  private inicializarCostos() {
    // Aseguramos campos no nulos y un estado de pago por defecto
    this.costosFiltrados = this.costos.map((c) => ({
      ...c,
      precio_unitario: c.precio_unitario ?? 0,
      subtotal: c.subtotal ?? 0,
      total: c.total ?? 0,
      beneficio: c.beneficio ?? 0,
      estado_pago: c.estado_pago ?? {id: 1, estado: 'Pendiente'},
    }));
  }

  private cargarEstadosDePago() {
    this.estadoPagoService.getEstadosPago().subscribe({
      next: (estados) => {
        this.estadosPago = estados.map((e) => ({
          id: Number(e.id),
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
