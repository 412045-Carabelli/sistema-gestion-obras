import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {Obra, Proveedor, Tarea, Transaccion} from '../../../core/models/models';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {Tooltip} from 'primeng/tooltip';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {ProveedoresStateService} from '../../../services/proveedores/proveedores-state.service';
import {StyleClass} from 'primeng/styleclass';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ReportesService} from '../../../services/reportes/reportes.service';

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
  obras: Obra[] = [];
  transacciones: Transaccion[] = [];
  obrasSaldoProveedor: Array<{ id: number; nombre: string; estado: string; total: number; pagado: number; saldo: number }> = [];
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
    private proveedoresStateService: ProveedoresStateService,
    private reportesService: ReportesService
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

  getEstadoObraDisplay(obra: Obra | null | undefined): string {
    const raw = obra?.obra_estado;
    if (!raw) return '-';
    if (typeof raw === 'string') return raw;
    return (raw as any)?.nombre ?? (raw as any)?.name ?? (raw as any)?.label ?? '-';
  }

  irADetalleObra(idObra: number) {
    this.router.navigate(['/obras', idObra]);
  }

  irADetalleObraMov(idObra: number) {
    // Navega a la obra y abre la pestaña de movimientos si existe (tab index 2).
    this.router.navigate(['/obras', idObra], {queryParams: {tab: 2}});
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
      obras: this.obrasService.getObras(),
      cuentaCorriente: this.reportesService.getCuentaCorrienteProveedor({proveedorId: id})
    })
      .subscribe({
        next: ({proveedor, tareas, transacciones, obras, cuentaCorriente}) => {
          this.proveedor = proveedor;
          this.proveedoresStateService.setProveedor(proveedor);
          this.tareas = tareas;
          this.transacciones = this.normalizarMovimientosProveedor(cuentaCorriente?.movimientos || transacciones || []);
          this.obras = obras || [];
          this.obrasMap = (obras || []).reduce((acc, obra) => {
            acc[obra.id!] = obra;
            return acc;
          }, {} as Record<number, Obra>);
          this.totalCostos = Number((cuentaCorriente as any)?.totalCostos ?? (cuentaCorriente as any)?.costos ?? 0);
          this.totalPagos = Number((cuentaCorriente as any)?.totalPagos ?? (cuentaCorriente as any)?.pagos ?? 0);
          this.saldoProveedor = Number((cuentaCorriente as any)?.saldoFinal ?? (cuentaCorriente as any)?.saldo ?? 0);
          this.obrasSaldoProveedor = this.construirObrasSaldoProveedor();
          this.loading = false;
        },
        error: () => (this.loading = false)
      });
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
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
      'EN_PROGRESO',
      'FINALIZADA'
    ]).has(estado);
  }

  private obraGeneraDeudaProveedor(obra: Obra | null | undefined): boolean {
    return this.obraGeneraDeuda(obra);
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

  get totalObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }

  get totalPagadoObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.pagado || 0), 0);
  }

  get totalSaldoObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.saldo || 0), 0);
  }

  private construirObrasSaldoProveedor(): Array<{ id: number; nombre: string; estado: string; total: number; pagado: number; saldo: number }> {
    const agrupado = new Map<number, { id: number; nombre: string; estado: string; total: number; pagado: number; saldo: number }>();

    (this.transacciones || [])
      .filter(m => this.movimientoPerteneceObraConDeuda(m))
      .forEach(mov => {
        const obraId = Number((mov as any)?.id_obra ?? (mov as any)?.obraId ?? 0);
        if (!obraId) return;
        const obra = this.obrasMap[obraId];
        if (!this.obraGeneraDeudaProveedor(obra)) return;
        const actual = agrupado.get(obraId) || {
          id: obraId,
          nombre: obra?.nombre || `Obra #${obraId}`,
          estado: this.getEstadoObraDisplay(obra),
          total: 0,
          pagado: 0,
          saldo: 0
        };
        const tipo = String((mov as any)?.tipo_transaccion ?? (mov as any)?.tipo ?? '').toUpperCase();
        const monto = Number((mov as any)?.monto ?? 0);
        if (tipo === 'COSTO') actual.total += monto;
        if (tipo === 'PAGO') actual.pagado += monto;
        actual.saldo = Math.max(0, actual.total - actual.pagado);
        agrupado.set(obraId, actual);
      });

    return Array.from(agrupado.values())
      .filter(item => item.total > 0 || item.pagado > 0)
      .sort((a, b) => b.saldo - a.saldo);
  }

  private normalizarMovimientosProveedor(movimientos: any[]): Transaccion[] {
    return (movimientos || [])
      .map(mov => ({
        ...mov,
        id_obra: (mov as any)?.obraId ?? (mov as any)?.id_obra,
        tipo_transaccion: (mov as any)?.tipo ?? (mov as any)?.tipo_transaccion,
        medio_pago: (mov as any)?.concepto ?? (mov as any)?.medio_pago,
        forma_pago: (mov as any)?.forma_pago ?? ((mov as any)?.tipo === 'COSTO' ? 'PENDIENTE' : (mov as any)?.forma_pago)
      } as Transaccion))
      .sort((a, b) => {
        const fa = new Date(String(a.fecha || '')).getTime() || 0;
        const fb = new Date(String(b.fecha || '')).getTime() || 0;
        return fb - fa;
      });
  }
}


