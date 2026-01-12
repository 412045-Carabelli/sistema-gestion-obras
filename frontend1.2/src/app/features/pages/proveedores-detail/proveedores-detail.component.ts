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
import {Obra, ObraCosto, Proveedor, Tarea, Transaccion} from '../../../core/models/models';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {Tooltip} from 'primeng/tooltip';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {CostosService} from '../../../services/costos/costos.service';
import {ProveedoresStateService} from '../../../services/proveedores/proveedores-state.service';
import {StyleClass} from 'primeng/styleclass';
import {Toast} from 'primeng/toast';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ModalComponent} from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-proveedores-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ProgressSpinnerModule,
    TableModule, Tooltip, StyleClass, Toast, EstadoFormatPipe, ClientesDocumentosComponent, ModalComponent
  ],
  templateUrl: './proveedores-detail.component.html'
})
export class ProveedoresDetailComponent implements OnInit, OnDestroy {
  proveedor!: Proveedor;
  tareas: Tarea[] = [];
  obrasMap: Record<number, Obra> = {};
  transacciones: Transaccion[] = [];
  costosProveedor: ObraCosto[] = [];
  costosMap: Record<number, ObraCosto> = {};
  transaccionesConSaldo: (Transaccion & { saldoRestante?: number })[] = [];
  totalCostos = 0;
  totalPagos = 0;
  saldoProveedor = 0;
  showMovimientoModal = false;
  movimientoSeleccionado?: (Transaccion & { saldoRestante?: number });
  loading = true;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proveedoresService: ProveedoresService,
    private tareasService: TareasService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
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

  refrescar() {
    if (this.proveedor?.id) {
      this.cargarDetalle(this.proveedor.id);
    }
  }

  getNombreObra(idObra: number): string {
    return this.obrasMap[idObra]?.nombre ?? `Obra #${idObra}`;
  }

  irADetalleObra(idObra: number) {
    this.router.navigate(['/obras', idObra]);
  }

  irADetalleObraMov(idObra: number) {
    // Navega a la obra y abre la pestaÃ±a de movimientos si existe (tab index 2).
    this.router.navigate(['/obras', idObra], { queryParams: { tab: 2 } });
  }

  abrirMovimientoModal(movimiento: Transaccion & { saldoRestante?: number }) {
    this.movimientoSeleccionado = movimiento;
    this.showMovimientoModal = true;
  }

  cerrarMovimientoModal() {
    this.showMovimientoModal = false;
    this.movimientoSeleccionado = undefined;
  }

  getTipoTransaccionLabel(transaccion: Transaccion): string {
    const tipo = (transaccion as any)?.tipo_transaccion;
    if (tipo && typeof tipo === 'object' && 'nombre' in tipo) {
      return (tipo as { nombre?: string }).nombre || '-';
    }

    return (tipo as string) || '-';
  }

  getReferenciaImputacion(transaccion: Transaccion): string {
    const idCosto = Number((transaccion as any)?.id_costo ?? 0);
    if (!idCosto) return '-';
    const costo = this.costosMap[idCosto];
    if (!costo) return 'Costo #' + idCosto;
    const base = costo.item_numero ? 'Item ' + costo.item_numero : 'Costo #' + idCosto;
    return costo.descripcion ? base + ' - ' + costo.descripcion : base;
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
      transacciones: this.transaccionesService.getByAsociado('PROVEEDOR', id)
    })
      .pipe(
        switchMap(({proveedor, tareas, transacciones}) => {
          this.proveedor = proveedor;
          this.tareas = tareas;
          this.transacciones = transacciones;
          this.proveedoresStateService.setProveedor(proveedor);

          const obraIds = Array.from(new Set([
            ...tareas.map(t => t.id_obra),
            ...transacciones.map(t => Number(t.id_obra)).filter(Boolean)
          ]));
          if (obraIds.length === 0) {
            return of([] as ObraCosto[][]);
          }
          return forkJoin(obraIds.map(obraId => this.costosService.getByObra(obraId)));
        })
      )
      .subscribe({
        next: (listadosCostos) => {
          const planos = ([] as ObraCosto[]).concat(...(listadosCostos || []));
          this.costosProveedor = planos.filter(c =>
            this.getIdProveedorCosto(c) === Number(this.proveedor.id)
          );
          this.costosMap = this.costosProveedor.reduce((acc, costo) => {
            if (costo.id != null) {
              acc[Number(costo.id)] = costo;
            }
            return acc;
          }, {} as Record<number, ObraCosto>);

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
    if (!tipo) return 'â€”';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  private calcularSaldoProveedor() {
    this.totalCostos = this.costosProveedor.reduce((sum, c) => sum + this.getCostoBase(c), 0);
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

  private getIdProveedorCosto(c: ObraCosto): number {
    return Number((c as any)?.id_proveedor ?? (c as any)?.proveedor?.id ?? 0);
  }

  private getCostoBase(costo: ObraCosto): number {
    const subtotal = costo.subtotal ?? (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0));
    return Number(subtotal ?? 0);
  }
}
