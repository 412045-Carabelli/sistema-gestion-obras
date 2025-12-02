import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {forkJoin, of, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {EstadoPago, Obra, ObraCosto, Proveedor, Tarea, Transaccion} from '../../../core/models/models';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {Tooltip} from 'primeng/tooltip';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {EstadoPagoService} from '../../../services/estado-pago/estado-pago.service';
import {CostosService} from '../../../services/costos/costos.service';
import {ProveedoresStateService} from '../../../services/proveedores/proveedores-state.service';
import {StyleClass} from 'primeng/styleclass';
import {Toast} from 'primeng/toast';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';

@Component({
  selector: 'app-proveedores-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ProgressSpinnerModule,
    TableModule, Tooltip, StyleClass, Toast, EstadoFormatPipe, ClientesDocumentosComponent
  ],
  templateUrl: './proveedores-detail.component.html'
})
export class ProveedoresDetailComponent implements OnInit, OnDestroy {
  proveedor!: Proveedor;
  tareas: Tarea[] = [];
  obrasMap: Record<number, Obra> = {};
  transacciones: Transaccion[] = [];
  estadosPago: EstadoPago[] = [];
  costosProveedor: ObraCosto[] = [];
  resumenEstados: { estado: string; cantidad: number; total: number }[] = [];
  transaccionesConSaldo: (Transaccion & { saldoRestante?: number })[] = [];
  totalCostos = 0;
  totalPagos = 0;
  saldoProveedor = 0;
  loading = true;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proveedoresService: ProveedoresService,
    private tareasService: TareasService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private estadoPagoService: EstadoPagoService,
    private costosService: CostosService,
    private proveedoresStateService: ProveedoresStateService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  getNombreObra(idObra: number): string {
    return this.obrasMap[idObra]?.nombre ?? `Obra #${idObra}`;
  }

  irADetalleObra(idObra: number) {
    this.router.navigate(['/obras', idObra]);
  }

  irADetalleObraMov(idObra: number) {
    // Navega a la obra y abre la pestaña de movimientos si existe (tab index 2).
    this.router.navigate(['/obras', idObra], { queryParams: { tab: 2 } });
  }

  toggleActivo() {
    const actualizado = {...this.proveedor, activo: !this.proveedor.activo};
    this.proveedoresService.updateProveedor(this.proveedor.id!, actualizado).subscribe({
      next: (prov) => {
        this.proveedor = prov;
        this.proveedoresStateService.setProveedor(prov);
      },
      error: () => {
        this.proveedoresStateService.setProveedor(this.proveedor);
      }
    });
  }

  private cargarDetalle(id: number) {
    this.loading = true;
    forkJoin({
      proveedor: this.proveedoresService.getProveedorById(id),
      tareas: this.tareasService.getTareasByProveedor(id),
      transacciones: this.transaccionesService.getByAsociado('PROVEEDOR', id),
      estadosPago: this.estadoPagoService.getEstadosPago()
    })
      .pipe(
        switchMap(({proveedor, tareas, transacciones, estadosPago}) => {
          this.proveedor = proveedor;
          this.tareas = tareas;
          this.transacciones = transacciones;
          this.estadosPago = estadosPago;
          this.proveedoresStateService.setProveedor(proveedor);

          const obraIds = Array.from(new Set(tareas.map(t => t.id_obra)));
          if (obraIds.length === 0) {
            return of([] as ObraCosto[][]);
          }
          return forkJoin(obraIds.map(obraId => this.costosService.getByObra(obraId)));
        })
      )
      .subscribe({
        next: (listadosCostos) => {
          const planos = ([] as ObraCosto[]).concat(...(listadosCostos || []));
          this.costosProveedor = planos.filter(c => Number(c.id_proveedor) === Number(this.proveedor.id));

          const mapa: Record<string, { cantidad: number; total: number }> = {};
          for (const c of this.costosProveedor) {
            if (!mapa[c.estado_pago!]) {
              mapa[c.estado_pago!] = {cantidad: 0, total: 0};
            }
            mapa[c.estado_pago!].cantidad += 1;
            mapa[c.estado_pago!].total += Number(c.total || 0);
          }
          this.resumenEstados = Object.entries(mapa).map(([estado, v]) => ({estado, cantidad: v.cantidad, total: v.total}));

          this.calcularSaldoProveedor();

          const obraIds = Array.from(new Set(this.costosProveedor.map(c => c.id_obra)));
          if (obraIds.length > 0) {
            forkJoin(obraIds.map(id => this.obrasService.getObraById(id))).subscribe({
              next: obras => {
                this.obrasMap = obras.reduce((acc, obra) => {
                  acc[obra.id!] = obra;
                  return acc;
                }, {} as Record<number, Obra>);
                this.loading = false;
              },
              error: () => (this.loading = false)
            });
          } else {
            this.loading = false;
          }
        },
        error: () => (this.loading = false)
      });
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  private calcularSaldoProveedor() {
    this.totalCostos = this.costosProveedor.reduce((sum, c) => sum + Number(c.total || 0), 0);
    this.totalPagos = this.transacciones.reduce((sum, t) => sum + Number(t.monto || 0), 0);
    this.saldoProveedor = this.totalCostos - this.totalPagos;

    const ordenadas = [...this.transacciones].sort((a, b) =>
      new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime()
    );

    let saldo = this.totalCostos;
    this.transaccionesConSaldo = ordenadas.map(t => {
      saldo -= Number(t.monto || 0);
      return {...t, saldoRestante: saldo};
    });
  }

  get tareasCompletadasCount(): number {
    return this.tareas.filter(t => (t.estado_tarea || '').toUpperCase() === 'COMPLETADA').length;
  }

  get tareasPendientesCount(): number {
    const total = this.tareas.length;
    const completadas = this.tareasCompletadasCount;
    return total - completadas;
  }
}
