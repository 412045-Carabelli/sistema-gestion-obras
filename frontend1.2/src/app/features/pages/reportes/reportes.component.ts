import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {catchError, debounceTime, switchMap, tap, map} from 'rxjs/operators';
import {
  AvanceTareasResponse,
  Cliente,
  CostosPorCategoriaResponse,
  EstadoFinancieroObraResponse,
  EstadoObra,
  EstadoObrasFilter,
  EstadoObrasResponse,
  FlujoCajaResponse,
  NotasObraResponse,
  Obra,
  PendientesResponse,
  Proveedor,
  RankingClientesResponse,
  RankingProveedoresResponse,
  ReportFilter,
  ResumenGeneralResponse,
  CuentaCorrienteObraResponse,
  CuentaCorrienteProveedorResponse,
  CuentaCorrienteClienteResponse,
  ComisionesResponse,
  ObraCosto
} from '../../../core/models/models';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {DropdownModule} from 'primeng/dropdown';
import {MultiSelectModule} from 'primeng/multiselect';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {DividerModule} from 'primeng/divider';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {Toast} from 'primeng/toast';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {Router} from '@angular/router';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    Select,
    DatePicker,
    Toast,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {

  filtrosForm!: FormGroup;

  obrasOptions: SelectOption<number>[] = [];
  clientesOptions: SelectOption<number>[] = [];
  proveedoresOptions: SelectOption<number>[] = [];
  estadosObraOptions: { label: string; name: string }[] = [];

  private clientesIndex: Record<number, string> = {};
  private proveedoresIndex: Record<number, string> = {};
  private obrasIndex: Record<number, string> = {};
  private obras: Obra[] = [];

  resumenGeneral: ResumenGeneralResponse | null = null;
  flujoCaja: FlujoCajaResponse | null = null;
  flujoDineroSerie: Array<{ fecha: string; ingresos: number; egresos: number; beneficio: number }> = [];
  flujoDineroMax = 0;
  pendientes: PendientesResponse | null = null;
  estadoObras: EstadoObrasResponse | null = null;
  avanceTareas: AvanceTareasResponse | null = null;
  costosPorCategoria: CostosPorCategoriaResponse | null = null;
  rankingClientes: RankingClientesResponse | null = null;
  rankingProveedores: RankingProveedoresResponse | null = null;
  notasGenerales: NotasObraResponse[] = [];
  notaObraSeleccionada: NotasObraResponse | null = null;
  estadoFinancieroObra: EstadoFinancieroObraResponse | null = null;
  cuentaCorrienteObra: CuentaCorrienteObraResponse | null = null;
  cuentaCorrienteProveedor: CuentaCorrienteProveedorResponse | null = null;
  cuentaCorrienteCliente: CuentaCorrienteClienteResponse | null = null;
  comisiones: ComisionesResponse | null = null;
  deudaClientesTotal = 0;
  deudaProveedoresTotal = 0;

  loading = false;
  private filtrosSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.filtrosSub = this.filtrosForm.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(() => this.loadReportes$())
      )
      .subscribe();
    this.loadCatalogos();
    this.loadReportes();
  }

  ngOnDestroy(): void {
    this.filtrosSub?.unsubscribe();
  }
  initForm(): void {
    this.filtrosForm = this.fb.group({
      obraId: [null],
      clienteId: [null],
      proveedorId: [null],
      estadosObra: [[]],
      rangoFechas: [null]
    });
  }

  loadCatalogos(): void {
    this.obrasService.getObras().subscribe({
      next: (obras: Obra[]) => {
        this.obras = obras || [];
        this.obrasOptions = obras.map((obra) => ({label: obra.nombre, value: obra.id!}));
        this.obrasIndex = Object.fromEntries(obras.map(o => [Number(o.id), o.nombre]));
      },
      error: () => this.showToast('error', 'Error', 'No se pudieron cargar las obras')
    });

    this.clientesService.getClientes().subscribe({
      next: (clientes: Cliente[]) => {
        this.clientesOptions = clientes.map((cliente) => ({label: cliente.nombre, value: cliente.id}));
        this.clientesIndex = Object.fromEntries(clientes.map(c => [Number(c.id), c.nombre]));
      },
      error: () => this.showToast('error', 'Error', 'No se pudieron cargar los clientes')
    });

    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores: Proveedor[]) => {
        this.proveedoresOptions = proveedores.map((proveedor) => ({label: proveedor.nombre, value: proveedor.id}));
        this.proveedoresIndex = Object.fromEntries(proveedores.map(p => [Number(p.id), p.nombre]));
        if (!this.filtrosForm?.value?.proveedorId) {
          this.loadReportes();
        }
      },
      error: () => this.showToast('error', 'Error', 'No se pudieron cargar los proveedores')
    });

    this.estadoObraService.getEstados().subscribe({
      next: (records) => {
        this.estadosObraOptions = this.ordenarEstadosObra(records);
      },
      error: () => this.showToast('error', 'Error', 'No se pudieron cargar los estados de obra')
    });
  }

  applyFilters(): void {
    this.loadReportes();
  }

  clearFilters(): void {
    this.filtrosForm.reset({
      obraId: null,
      clienteId: null,
      proveedorId: null,
      estadosObra: [],
      rangoFechas: null
    }, { emitEvent: false });
    this.loadReportes();
  }

  private loadReportes(): void {
    this.loadReportes$().subscribe();
  }

  private loadReportes$(): Observable<void> {
    this.loading = true;

    const filtrosReporte = this.buildReportFilter();
    const filtrosCCObra = this.ensureFilterId(filtrosReporte, 'obraId');
    const filtrosCCProveedor = this.ensureFilterId(filtrosReporte, 'proveedorId');
    const filtrosEstadoObra = this.buildEstadoObraFilter();

    return forkJoin({
      resumen: this.withDefault(this.reportesService.getResumenGeneral(), {
        totalObras: 0,
        totalClientes: 0,
        totalProveedores: 0,
        totalIngresos: 0,
        totalEgresos: 0
      }),
      flujoCaja: this.withDefault(this.reportesService.getFlujoCaja(filtrosReporte), {
        totalIngresos: 0,
        totalEgresos: 0,
        saldoFinal: 0,
        movimientos: []
      }),
      deudasGlobales: this.withDefault(this.reportesService.getDeudasGlobales(filtrosReporte), {
        deudaClientes: 0,
        deudaProveedores: 0
      }),
      cuentaCorrienteObra: filtrosCCObra
        ? this.withDefault(this.reportesService.getCuentaCorrienteObra(filtrosCCObra), {
        obraId: filtrosCCObra.obraId,
        obraNombre: '',
        totalIngresos: 0,
        totalEgresos: 0,
        saldoFinal: 0,
        movimientos: []
      })
        : this.withDefault(this.reportesService.getCuentaCorrienteObraGlobal(filtrosReporte), {
        obraId: undefined,
        obraNombre: 'Todas las obras',
        totalIngresos: 0,
        totalEgresos: 0,
        saldoFinal: 0,
        movimientos: []
      }),
      cuentaCorrienteProveedor: filtrosCCProveedor
        ? this.withDefault(this.reportesService.getCuentaCorrienteProveedor(filtrosCCProveedor), {
        proveedorId: filtrosCCProveedor.proveedorId,
        proveedorNombre: '',
        totalCostos: 0,
        totalPagos: 0,
        saldoFinal: 0,
        movimientos: []
      })
        : this.withDefault(this.reportesService.getCuentaCorrienteProveedorGlobal(filtrosReporte), {
        proveedorId: undefined,
        proveedorNombre: 'Todos los proveedores',
        totalCostos: 0,
        totalPagos: 0,
        saldoFinal: 0,
        movimientos: []
      }),
      cuentaCorrienteCliente: this.withDefault(this.reportesService.getCuentaCorrienteCliente(filtrosReporte), {
        clienteId: filtrosReporte?.clienteId,
        clienteNombre: filtrosReporte?.clienteId ? '' : 'Todos los clientes',
        totalCobros: 0,
        totalCostos: 0,
        saldoFinal: 0,
        movimientos: []
      }),
      pendientes: this.withDefault(this.reportesService.getPendientes(filtrosReporte), {pendientes: []}),
      estadoObras: this.withDefault(this.reportesService.getEstadoObras(filtrosEstadoObra), {obras: []}),
      avanceTareas: this.withDefault(this.reportesService.getAvanceTareas(filtrosReporte), {avances: []}),
      costosCategoria: this.withDefault(this.reportesService.getCostosPorCategoria(filtrosReporte), {total: 0, categorias: []}),
      rankingClientes: this.withDefault(this.reportesService.getRankingClientes(filtrosReporte), {clientes: []}),
      rankingProveedores: this.withDefault(this.reportesService.getRankingProveedores(filtrosReporte), {proveedores: []}),
      notasGenerales: this.withDefault(this.reportesService.getNotasGenerales(), []),
      comisiones: this.withDefault(this.reportesService.getComisiones(filtrosReporte), {
        totalComision: 0,
        totalPagos: 0,
        saldo: 0,
        detalle: []
      })
    }).pipe(
      tap({
        next: (data) => {
        this.resumenGeneral = data.resumen;
        this.flujoCaja = data.flujoCaja;
        this.flujoDineroSerie = this.construirSerieFlujo(this.flujoCaja?.movimientos || []);
        this.cuentaCorrienteObra = this.mapCuentaCorrienteObra(data.cuentaCorrienteObra, filtrosReporte);
          this.cuentaCorrienteProveedor = this.mapCuentaCorrienteProveedor(data.cuentaCorrienteProveedor, filtrosReporte);
          this.cuentaCorrienteCliente = this.mapCuentaCorrienteCliente(data.cuentaCorrienteCliente, filtrosReporte);
          this.pendientes = data.pendientes;
          this.estadoObras = data.estadoObras;
          this.avanceTareas = data.avanceTareas;
          this.costosPorCategoria = data.costosCategoria;
          this.rankingClientes = data.rankingClientes;
          this.rankingProveedores = data.rankingProveedores;
          this.notasGenerales = data.notasGenerales;
          this.comisiones = data.comisiones;
          this.deudaClientesTotal = Number(data.deudasGlobales?.deudaClientes ?? 0);
          this.deudaProveedoresTotal = Number(data.deudasGlobales?.deudaProveedores ?? 0);

          const obraId = filtrosReporte?.obraId ?? null;
          if (obraId) {
            this.loadEstadoFinanciero(obraId);
          } else {
            this.estadoFinancieroObra = null;
            this.notaObraSeleccionada = null;
          }

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.showToast('error', 'Error', 'No se pudieron cargar los reportes. Intenta nuevamente.');
        }
      }),
      map(() => void 0)
    );
  }

  private ordenarEstadosObra(records: { label: string; name: string }[]): { label: string; name: string }[] {
    const ordenDeseado = [
      'PRESUPUESTADA',
      'COTIZADA',
      'PERDIDA',
      'ADJUDICADA',
      'EN_PROGRESO',
      'FINALIZADA',
      'FACTURADA'
    ];
    const index = new Map(ordenDeseado.map((estado, i) => [estado, i]));
    const normalizar = (value?: string | null) =>
      (value || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

    return [...(records || [])].sort((a, b) => {
      const aKey = index.get(normalizar(a?.name || a?.label)) ?? 999;
      const bKey = index.get(normalizar(b?.name || b?.label)) ?? 999;
      if (aKey !== bKey) return aKey - bKey;
      return (a?.label || '').localeCompare(b?.label || '');
    });
  }

  private ensureFilterId(filter: ReportFilter | undefined, key: 'obraId' | 'proveedorId' | 'clienteId', fallback?: number | null): ReportFilter | undefined {
    const val = filter?.[key] ?? fallback;
    if (!val) return undefined;
    return {...(filter ?? {}), [key]: val};
  }

  private mapCuentaCorrienteObra(data: any, filtros?: ReportFilter): any {
    if (!data) return null;
    const totalEgresos = data.costoTotal ?? data.totalEgresos ?? 0;
    const totalIngresos = data.pagosRecibidos ?? data.totalIngresos ?? 0;
    const saldoFinal = data.saldoPendiente ?? data.saldoFinal ?? (totalIngresos - totalEgresos);
    const movimientos = this.mapMovimientosObra(data.movimientos || [], data.obraNombre);

    return {
      ...data,
      totalEgresos,
      totalIngresos,
      saldoFinal,
      movimientos
    };
  }

  private mapCuentaCorrienteProveedor(data: any, filtros?: ReportFilter): any {
    if (!data) return null;
    const totalCostos = data.costos ?? data.totalCostos ?? 0;
    const totalPagos = data.pagos ?? data.totalPagos ?? 0;
    const saldoFinal = data.saldo ?? data.saldoFinal ?? (totalCostos - totalPagos);
    const movimientos = this.mapMovimientosProveedor(data.movimientos || [], data.proveedorId, data.proveedorNombre);

    return {
      ...data,
      totalCostos,
      totalPagos,
      saldoFinal,
      movimientos
    };
  }

  private mapCuentaCorrienteCliente(data: any, filtros?: ReportFilter): any {
    if (!data) return null;
    const totalCobros = data.cobros ?? data.totalCobros ?? data.totalIngresos ?? 0;
    const totalCostos = data.totalCostos ?? 0;
    const saldoFinal = data.saldo ?? data.saldoFinal ?? (totalCostos - totalCobros);
    const movimientos = this.mapMovimientosCliente(data.movimientos || []);

    return {
      ...data,
      totalCobros,
      totalCostos,
      saldoFinal,
      movimientos
    };
  }

  private loadEstadoFinanciero(obraId: number): void {
    this.reportesService.getEstadoFinanciero(obraId).pipe(
      catchError((error) => {
        console.error('Error al cargar estado financiero', error);
        this.showToast('warn', 'Advertencia', 'El estado financiero no pudo cargarse.');
        return of(null);
      })
    ).subscribe((data) => this.estadoFinancieroObra = data);
  }

  private buildReportFilter(): ReportFilter | undefined {
    const {obraId, clienteId, proveedorId, rangoFechas} = this.filtrosForm.value;
    const filtro: ReportFilter = {};

    if (obraId) filtro.obraId = obraId;
    if (clienteId) filtro.clienteId = clienteId;
    if (proveedorId) filtro.proveedorId = proveedorId;
    if (rangoFechas && Array.isArray(rangoFechas)) {
      const [inicio, fin] = rangoFechas;
      if (inicio) filtro.fechaInicio = this.formatDateValue(inicio);
      if (fin) filtro.fechaFin = this.formatDateValue(fin);
    }

    return Object.keys(filtro).length > 0 ? filtro : undefined;
  }

  private buildEstadoObraFilter(): EstadoObrasFilter | undefined {
    const {estadosObra, clienteId, rangoFechas} = this.filtrosForm.value;
    const filtro: EstadoObrasFilter = {};

    if (estadosObra?.length) filtro.estados = estadosObra;
    if (clienteId) filtro.clienteId = clienteId;
    if (rangoFechas?.length) {
      const [inicio, fin] = rangoFechas;
      if (inicio) filtro.fechaInicio = this.formatDateValue(inicio);
      if (fin) filtro.fechaFin = this.formatDateValue(fin);
    }

    return Object.keys(filtro).length > 0 ? filtro : undefined;
  }

  private formatDateValue(value: Date): string {
    return formatDate(value, 'yyyy-MM-dd', 'es-AR');
  }

  private construirSerieFlujo(movimientos: any[]): Array<{ fecha: string; ingresos: number; egresos: number; beneficio: number }> {
    const agrupados = new Map<string, { ingresos: number; egresos: number }>();
    (movimientos || []).forEach(mov => {
      const fecha = (mov?.fecha || '').toString().split('T')[0] || 'Sin fecha';
      const actual = agrupados.get(fecha) ?? { ingresos: 0, egresos: 0 };
      const tipo = (mov?.tipo_movimiento || mov?.tipo || '').toString().toUpperCase();
      if (tipo === 'INGRESO' || tipo === 'COBRO') {
        actual.ingresos += Number(mov?.monto ?? 0);
      } else if (tipo === 'EGRESO' || tipo === 'PAGO') {
        actual.egresos += Number(mov?.monto ?? 0);
      }
      agrupados.set(fecha, actual);
    });

    const ordenadas = Array.from(agrupados.entries())
      .map(([fecha, data]) => ({ fecha, ingresos: data.ingresos, egresos: data.egresos }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    this.flujoDineroMax = ordenadas.reduce((acc, item) => Math.max(acc, item.ingresos, item.egresos), 0);

    let beneficio = 0;
    return ordenadas.map(item => {
      beneficio += item.ingresos - item.egresos;
      return { ...item, beneficio };
    });
  }

  private filtrarMovimientosPorFecha(movs: any[], filtros?: ReportFilter): any[] {
    if (!filtros?.fechaInicio && !filtros?.fechaFin && !filtros?.obraId) return movs;
    const inicio = filtros?.fechaInicio ? new Date(`${filtros.fechaInicio}T00:00:00`) : null;
    const fin = filtros?.fechaFin ? new Date(`${filtros.fechaFin}T23:59:59`) : null;
    const obraId = filtros?.obraId ? Number(filtros.obraId) : null;
    return movs.filter(m => {
      if (obraId) {
        const idMov = Number(m?.obraId ?? m?.id_obra ?? 0);
        if (idMov !== obraId) return false;
      }
      return this.estaEnRangoFecha(m?.fecha, inicio, fin);
    });
  }

  private buildCuentaCorrienteObraGlobal(movs: any[], filtros?: ReportFilter): any {
    const movimientos = this.filtrarMovimientosPorFecha(
      this.mapMovimientosObra(movs, undefined),
      filtros
    );
    const totalIngresos = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'COBRO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    const totalEgresos = movimientos
      .filter(m => ['PAGO', 'COSTO'].includes((m.tipo || '').toString().toUpperCase()))
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    return {
      obraId: undefined,
      obraNombre: 'Todas las obras',
      totalIngresos,
      totalEgresos,
      saldoFinal: totalIngresos - totalEgresos,
      movimientos
    };
  }

  private buildCuentaCorrienteProveedorGlobal(movs: any[], filtros?: ReportFilter): any {
    const movimientos = this.filtrarMovimientosPorFecha(
      this.mapMovimientosProveedor(movs),
      filtros
    );
    const totalCostos = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'COSTO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    const totalPagos = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'PAGO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    return {
      proveedorId: undefined,
      proveedorNombre: 'Todos los proveedores',
      totalCostos,
      totalPagos,
      saldoFinal: totalCostos - totalPagos,
      movimientos
    };
  }

  private buildCuentaCorrienteProveedorGlobalFromProveedores(
    proveedores: CuentaCorrienteProveedorResponse[],
    filtros?: ReportFilter
  ): CuentaCorrienteProveedorResponse {
    const movimientos = this.filtrarMovimientosPorFecha(
      proveedores.flatMap((prov) =>
        this.mapMovimientosProveedor(prov.movimientos || [], prov.proveedorId, prov.proveedorNombre)
      ),
      filtros
    );
    const totalCostos = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'COSTO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    const totalPagos = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'PAGO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    return {
      proveedorId: undefined,
      proveedorNombre: 'Todos los proveedores',
      totalCostos,
      totalPagos,
      saldoFinal: totalCostos - totalPagos,
      movimientos
    };
  }

  private buildCuentaCorrienteClienteGlobal(movs: any[], filtros?: ReportFilter): any {
    const movimientos = this.filtrarMovimientosPorFecha(
      this.mapMovimientosCliente(movs),
      filtros
    );
    const totalCobros = movimientos
      .filter(m => (m.tipo || '').toString().toUpperCase() === 'COBRO')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
    const totalCostos = this.calcularTotalPresupuestoClientes(filtros);
    return {
      clienteId: undefined,
      clienteNombre: 'Todos los clientes',
      totalCobros,
      totalCostos,
      saldoFinal: totalCostos - totalCobros,
      movimientos
    };
  }

  private estaEnRangoFecha(
    fecha: string | Date | undefined | null,
    inicio: Date | null,
    fin: Date | null
  ): boolean {
    if (!fecha) return false;
    const fechaMov = this.normalizarFechaLocal(fecha);
    if (!fechaMov) return false;
    if (inicio && fechaMov < inicio) return false;
    if (fin && fechaMov > fin) return false;
    return true;
  }

  private normalizarFechaLocal(value: string | Date): Date | null {
    if (value instanceof Date) return value;
    if (!value) return null;
    const raw = value.toString();
    const withTime = raw.includes('T') ? raw : `${raw}T00:00:00`;
    const parsed = new Date(withTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private withDefault<T>(observable: Observable<T>, defaultValue: T): Observable<T> {
    return observable.pipe(
      catchError(() => {
        this.showToast('warn', 'Advertencia', 'Algunos reportes no pudieron cargarse por completo.');
        return of(defaultValue);
      })
    );
  }

  private calcularDeudaClientesPorCobros(flujo: FlujoCajaResponse | null, filtros?: ReportFilter): number {
    if (filtros?.proveedorId && !filtros?.obraId && !filtros?.clienteId) {
      return 0;
    }

    const obrasFiltradas = this.filtrarObrasPorFiltroConDeuda(filtros);
    const totalPresupuesto = obrasFiltradas.reduce((sum, obra) => sum + this.obtenerPresupuestoObra(obra), 0);
    const cobros = Number(flujo?.totalIngresos ?? 0);
    return Math.max(0, totalPresupuesto - cobros);
  }

  private calcularTotalPresupuestoClientes(filtros?: ReportFilter): number {
    const obrasFiltradas = this.filtrarObrasPorFiltroConDeuda(filtros);
    return obrasFiltradas.reduce((sum, obra) => sum + this.obtenerPresupuestoObra(obra), 0);
  }

  private filtrarObrasPorFiltro(filtros?: ReportFilter): Obra[] {
    let lista = this.obras || [];
    if (filtros?.obraId) {
      lista = lista.filter(o => Number(o.id) === Number(filtros.obraId));
    }
    if (filtros?.clienteId) {
      lista = lista.filter(o => Number(o.cliente?.id) === Number(filtros.clienteId));
    }
    return lista;
  }

  private obtenerPresupuestoObra(obra: Obra): number {
    if (!obra) return 0;
    const costos = obra.costos ?? [];
    if (!costos.length) {
      return Number(obra.presupuesto ?? 0);
    }

    const beneficioGlobal = obra.beneficio_global ? Number(obra.beneficio ?? 0) : null;
    const subtotalCostos = costos.reduce((acc, c: ObraCosto) => {
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + base;
    }, 0);

    const beneficioCostos = costos.reduce((acc, c: ObraCosto) => {
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const porc = esAdicional
        ? Number(c.beneficio ?? 0)
        : (beneficioGlobal !== null ? beneficioGlobal : Number(c.beneficio ?? 0));
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + (base * (porc / 100));
    }, 0);

    const totalConBeneficio = subtotalCostos + beneficioCostos;
    const comisionPorc = obra.tiene_comision ? Number(obra.comision ?? 0) : 0;
    return totalConBeneficio * (1 + (comisionPorc / 100));
  }

  private calcularDeudaProveedores(pendientes: PendientesResponse | null): number {
    const lista = pendientes?.pendientes || [];
    if (!lista.length) return 0;
    const obrasConDeuda = new Set(
      (this.obras || []).filter(obra => this.obraGeneraDeuda(obra)).map(obra => Number(obra.id))
    );
    return lista.reduce((sum, p) => {
      if (!obrasConDeuda.has(Number(p.obraId))) return sum;
      return sum + Number(p.total ?? 0);
    }, 0);
  }

  private filtrarObrasPorFiltroConDeuda(filtros?: ReportFilter): Obra[] {
    const base = this.filtrarObrasPorFiltro(filtros);
    return base.filter(obra => this.obraGeneraDeuda(obra));
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

  private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({severity, summary, detail});
  }

  nombreAsociado(tipo?: string, id?: number): string {
    if (!id) return '-';
    const t = (tipo || '').toString().toUpperCase();
    if (t === 'CLIENTE' || t === 'CLIENTES') return this.clientesIndex[id] || `Cliente #${id}`;
    if (t === 'PROVEEDOR' || t === 'PROVEEDORES') return this.proveedoresIndex[id] || `Proveedor #${id}`;
    return `#${id}`;
  }

  saldoSinNegativo(valor?: number): number {
    return Math.max(valor ?? 0, 0);
  }

  irAObra(obraId?: number | null) {
    const id = Number(obraId ?? 0);
    if (!Number.isFinite(id) || id <= 0) return;
    this.router.navigate(['/obras', id]);
  }

  irACliente(clienteId?: number | null) {
    const id = Number(clienteId ?? 0);
    if (!Number.isFinite(id) || id <= 0) return;
    this.router.navigate(['/clientes', id]);
  }

  irAProveedor(proveedorId?: number | null) {
    const id = Number(proveedorId ?? 0);
    if (!Number.isFinite(id) || id <= 0) return;
    this.router.navigate(['/proveedores', id]);
  }

  private mapMovimientosObra(movs: any[], obraNombre?: string): any[] {
    return movs.map(m => {
      const tipo = (m.tipo || '').toString().toUpperCase();
      const concepto =
        tipo === 'COSTO'
          ? (m.referencia || m.concepto || m.detalle || '-')
        : tipo === 'PAGO' || tipo === 'COBRO'
          ? (m.observacion || m.referencia || m.concepto || m.detalle || '-')
          : (m.referencia || m.concepto || m.detalle || '-');

      return {
        ...m,
        concepto,
        obraNombre: m.obraNombre || this.obrasIndex[Number(m.obraId)] || obraNombre,
        asociadoNombre: this.nombreAsociado(m.asociadoTipo, m.asociadoId),
        cobrosAcumulados: m.cobrosAcumulados ?? m.ingresosAcumulados ?? m.cobrosAcum ?? m.acumuladoCobros ?? 0,
        costosAcumulados: m.costosAcumulados ?? m.egresosAcumulados ?? m.costoAcum ?? m.acumuladoCostos ?? 0,
        saldoCliente: m.saldoCliente ?? 0
      };
    });
  }

  private mapMovimientosProveedor(movs: any[], proveedorId?: number, proveedorNombre?: string): any[] {
    return movs
      .map(m => {
        const rawTipo = (m?.tipo_movimiento ?? m?.tipo_transaccion ?? m?.tipo) as any;
        const tipoTexto = typeof rawTipo === 'string'
          ? rawTipo
          : rawTipo?.nombre ?? rawTipo?.name ?? '';
        let tipo = (tipoTexto || '').toString().toUpperCase();
        if (tipo === 'EGRESO') tipo = 'COSTO';
        if (tipo === 'INGRESO') tipo = 'COBRO';
        if (tipo === 'PAGADO') tipo = 'PAGO';
        return {
          ...m,
          tipo,
          proveedorId: m?.proveedorId ?? m?.id_proveedor ?? proveedorId,
          proveedorNombre: m?.proveedorNombre ?? proveedorNombre
        };
      })
      .filter(m => ['PAGO', 'COSTO'].includes((m?.tipo || '').toString().toUpperCase()))
      .map(m => {
      const tipo = (m.tipo || '').toString().toUpperCase();
      const concepto =
        tipo === 'COSTO'
          ? (m.concepto || m.referencia || m.detalle || '-')
          : tipo === 'PAGO' || tipo === 'COBRO'
            ? (m.observacion || m.concepto || m.referencia || m.detalle || '-')
            : (m.concepto || m.referencia || m.detalle || '-');
      const asociadoId = m.asociadoId ?? m.proveedorId ?? m.id_proveedor;
      const asociadoNombre =
        m.asociadoNombre ||
        m.proveedorNombre ||
        (asociadoId ? (this.proveedoresIndex[Number(asociadoId)] || `Proveedor #${asociadoId}`) : null);

      return {
        ...m,
        concepto,
        obraNombre: m.obraNombre || this.obrasIndex[Number(m.obraId)],
        asociadoNombre,
        saldoProveedor: m.saldoProveedor ?? 0
      };
    });
  }

  private movimientoPerteneceObraConDeuda(mov: any): boolean {
    const obraId = Number(mov?.obraId ?? mov?.id_obra ?? 0);
    if (!obraId) return true;
    const obra = this.obras.find(o => Number(o.id) === obraId);
    return this.obraGeneraDeuda(obra);
  }

  private mapMovimientosCliente(movs: any[]): any[] {
    return movs
      .filter(m => (m?.tipo || '').toString().toUpperCase() === 'COBRO')
      .map(m => {
      const tipo = (m.tipo || '').toString().toUpperCase();
      const concepto =
        tipo === 'COSTO'
          ? (m.referencia || m.concepto || m.detalle || '-')
          : tipo === 'PAGO' || tipo === 'COBRO'
            ? (m.observacion || m.referencia || m.concepto || m.detalle || '-')
            : (m.referencia || m.concepto || m.detalle || '-');

      return {
        ...m,
        concepto,
        obraNombre: m.obraNombre || this.obrasIndex[Number(m.obraId)],
        asociadoNombre: this.nombreAsociado(m.asociadoTipo, m.asociadoId),
        cobrosAcumulados: m.cobrosAcumulados ?? m.ingresosAcumulados ?? m.acumuladoCobros ?? 0,
        costosAcumulados: m.costosAcumulados ?? m.egresosAcumulados ?? m.acumuladoCostos ?? 0,
        saldoCliente: m.saldoCliente ?? 0
      };
    });
  }
}
