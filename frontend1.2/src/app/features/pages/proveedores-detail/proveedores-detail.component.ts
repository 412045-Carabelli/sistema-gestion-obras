import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {Obra, ObraCosto, Proveedor, Tarea, Transaccion} from '../../../core/models/models';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {Tooltip} from 'primeng/tooltip';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {ProveedoresStateService} from '../../../services/proveedores/proveedores-state.service';
import {StyleClass} from 'primeng/styleclass';
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
    TableModule, TagModule, Tooltip, StyleClass, EstadoFormatPipe, ClientesDocumentosComponent
  ],
  templateUrl: './proveedores-detail.component.html'
})
export class ProveedoresDetailComponent implements OnInit, OnDestroy {
  proveedor!: Proveedor;
  tareas: Tarea[] = [];
  obrasMap: Record<number, Obra> = {};
  transacciones: Transaccion[] = [];
  costosProveedor: ObraCosto[] = [];
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
    private proveedoresStateService: ProveedoresStateService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.proveedoresStateService.clearProveedor();
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


  getTipoTransaccionLabel(transaccion: Transaccion): string {
    const tipo = (transaccion as any)?.tipo_transaccion;
    if (tipo && typeof tipo === 'object' && 'nombre' in tipo) {
      return (tipo as { nombre?: string }).nombre || '-';
    }

    return (tipo as string) || '-';
  }

  private esPago(transaccion: Transaccion): boolean {
    const raw: any = (transaccion as any)?.tipo_transaccion ?? (transaccion as any)?.tipo_movimiento;
    if (typeof raw === 'string') return raw.toUpperCase() === 'PAGO';
    if (raw && typeof raw === 'object' && 'nombre' in raw) {
      return ((raw as { nombre?: string }).nombre || '').toUpperCase() === 'PAGO';
    }
    if (raw && typeof raw.id === 'number') return raw.id === 2;
    return false;
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
      obras: this.obrasService.getObras()
    })
      .subscribe({
        next: ({proveedor, tareas, transacciones, obras}) => {
          this.proveedor = proveedor;
          this.proveedoresStateService.setProveedor(proveedor);
          this.tareas = tareas;
          this.transacciones = transacciones;
          this.obrasMap = (obras || []).reduce((acc, obra) => {
            acc[obra.id!] = obra;
            return acc;
          }, {} as Record<number, Obra>);

          const costosProveedor: ObraCosto[] = [];
          (obras || []).forEach(obra => {
            if (!this.obraGeneraDeuda(obra)) return;
            (obra.costos || []).forEach(costo => {
              if (this.getIdProveedorCosto(costo) === Number(this.proveedor.id)) {
                costosProveedor.push(costo);
              }
            });
          });
          this.costosProveedor = costosProveedor;
          this.calcularSaldoProveedor();
          this.loading = false;
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
    const totalCalculado = this.costosProveedor.reduce((sum, c) => sum + this.getCostoBase(c), 0);
    const pagosCalculados = this.transacciones
      .filter(t => this.esPago(t))
      .filter(t => this.movimientoPerteneceObraConDeuda(t))
      .reduce((sum, t) => sum + Number(t.monto || 0), 0);
    const totalApi = (this.proveedor as any)?.totalProveedor;
    const pagosApi = (this.proveedor as any)?.pagosRealizados;
    const saldoApi = (this.proveedor as any)?.saldoProveedor;
    this.totalCostos = Number.isFinite(Number(totalApi)) ? Number(totalApi) : totalCalculado;
    this.totalPagos = Number.isFinite(Number(pagosApi)) ? Number(pagosApi) : pagosCalculados;
    const saldoCalculado = this.totalCostos - this.totalPagos;
    this.saldoProveedor = Number.isFinite(Number(saldoApi)) ? Number(saldoApi) : saldoCalculado;

  }

  private movimientoPerteneceObraConDeuda(transaccion: Transaccion): boolean {
    const obraId = Number((transaccion as any)?.id_obra ?? (transaccion as any)?.obraId ?? 0);
    if (!obraId) return true;
    const obra = this.obrasMap[obraId];
    if (!obra) return true;
    return this.obraGeneraDeuda(obra);
  }

  private obraGeneraDeuda(obra: Obra | null | undefined): boolean {
    if (!obra) return false;
    const estado = this.normalizarEstadoObra(obra?.obra_estado);
    return new Set([
      'ADJUDICADA',
      'EN_PROGRESO',
      'FINALIZADA'
    ]).has(estado);
  }

  private normalizarEstadoObra(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string') return this.sanitizarEstado(raw);
    const nombre = raw?.nombre ?? raw?.name ?? raw?.label ?? raw?.estado ?? '';
    return this.sanitizarEstado(String(nombre || ''));
  }

  private sanitizarEstado(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private getIdProveedorCosto(c: ObraCosto): number {
    return Number((c as any)?.id_proveedor ?? (c as any)?.proveedor?.id ?? 0);
  }

  private getCostoBase(costo: ObraCosto): number {
    const subtotal = costo.subtotal ?? (Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0));
    return Number(subtotal ?? 0);
  }
}
