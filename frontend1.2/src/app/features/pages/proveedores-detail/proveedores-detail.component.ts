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

@Component({
  selector: 'app-proveedores-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ProgressSpinnerModule,
    TableModule, RouterLink, Tooltip, StyleClass, Toast
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
          console.log(proveedor)
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
            const id = (c as any).estado_pago ?? c.id_estado_pago ?? 1;
            const estado = this.labelEstado(id);
            if (!mapa[estado]) {
              mapa[estado] = {cantidad: 0, total: 0};
            }
            mapa[estado].cantidad += 1;
            mapa[estado].total += Number(c.total || 0);
          }
          this.resumenEstados = Object.entries(mapa).map(([estado, v]) => ({estado, cantidad: v.cantidad, total: v.total}));

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

  private labelEstado(id?: number): string {
    switch (Number(id)) {
      case 1: return 'Pendiente';
      case 2: return 'Parcial';
      case 3: return 'Pagado';
      default:
        const match = this.estadosPago.find(e => e.id === id);
        return match?.estado || 'Pendiente';
    }
  }
}
