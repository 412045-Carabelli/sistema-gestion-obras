import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, DatePipe, formatDate} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';

(pdfMake as any).vfs = (pdfFonts as any)['vfs'];
import {forkJoin, Observable, of, Subscription, switchMap} from 'rxjs';
import {catchError, tap, map, timeout} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {
  Cliente,
  Obra,
  Proveedor,
  ReportFilter,
  ComisionesResponse,
  ReportesConsolidadoResponse
} from '../../../core/models/models';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
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
import {ResumenObrasComponent} from '../../components/resumen-obras/resumen-obras.component';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';
import { GenericFilterBarComponent, FilterDefinition } from '../../components/generic-filter-bar/generic-filter-bar.component';
import { TableSkeletonComponent } from '../../../shared/table-skeleton/table-skeleton.component';
import { TransaccionesService } from '../../../services/transacciones/transacciones.service';

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
    ConfirmDialog,
    ResumenObrasComponent,
    LayoutHeaderComponent,
    GenericFilterBarComponent,
    TableSkeletonComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {

  filterDefinitions: FilterDefinition[] = [];
  currentFilters: Record<string, any> = {};

  obrasOptions: SelectOption<number>[] = [];
  clientesOptions: SelectOption<number>[] = [];
  proveedoresOptions: SelectOption<number>[] = [];

  comisiones: ComisionesResponse | null = null;
  reporteConsolidado: ReportesConsolidadoResponse | null = null;
  filterInitialValues: Record<string, any> | null = null;
  activeFilter: ReportFilter | undefined;

  loading = false;
  catalogosLoading = true;
  pagandoComisionObraId: number | null = null;
  private filtrosSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private reportesService: ReportesService,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private transaccionesService: TransaccionesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    this.filterInitialValues = { fechaInicio: hace30Dias, fechaFin: hoy };
    this.currentFilters = { fechaInicio: hace30Dias, fechaFin: hoy };

    this.loadCatalogos();
    this.loadReportes();
  }

  ngOnDestroy(): void {
    this.filtrosSub?.unsubscribe();
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      {
        key: 'obraId',
        label: 'Obra',
        type: 'select',
        placeholder: 'Todas las obras',
        options: this.obrasOptions
      },
      {
        key: 'clienteId',
        label: 'Cliente',
        type: 'select',
        placeholder: 'Todos los clientes',
        options: this.clientesOptions
      },
      {
        key: 'proveedorId',
        label: 'Proveedor',
        type: 'select',
        placeholder: 'Todos los proveedores',
        options: this.proveedoresOptions
      },
      {
        key: 'fechaInicio',
        label: 'Fecha desde',
        type: 'date'
      },
      {
        key: 'fechaFin',
        label: 'Fecha hasta',
        type: 'date'
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.actualizarOpcionesConFiltros(filters).then(() => this.loadReportes$().subscribe());
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.setupFilterDefinitions();
    this.loadReportes();
  }

  /** Filtrado en cascada: al elegir obra/cliente/proveedor, acota las opciones de los otros combos. */
  private actualizarOpcionesConFiltros(filters: Record<string, any>): Promise<void> {
    const obraId = filters['obraId'];
    const clienteId = filters['clienteId'];
    const proveedorId = filters['proveedorId'];

    return new Promise(resolve => {
      // Cliente: traer obras del cliente → proveedores de esas obras
      if (clienteId) {
        this.filtrosSub?.unsubscribe();
        this.filtrosSub = this.http.get<Array<{id: number; nombre: string}>>(
          `${environment.apiGateway}/bff/reportes/filtros/obras-por-cliente?clienteId=${clienteId}`
        ).pipe(
          switchMap(obras => {
            this.actualizarOpcionesEnFilterBar('obraId', obras);
            if (obras.length === 0) return of([]);
            const provReqs = obras.map(o =>
              this.http.get<Array<{id: number; nombre: string}>>(
                `${environment.apiGateway}/bff/reportes/filtros/proveedores-por-obra?obraId=${o.id}`
              )
            );
            return forkJoin(provReqs);
          })
        ).subscribe({
          next: (results: any) => {
            const provSet = new Map<number, string>();
            results.forEach((provs: any) => provs.forEach((p: any) => provSet.set(p.id, p.nombre)));
            this.actualizarOpcionesEnFilterBar('proveedorId',
              Array.from(provSet.entries()).map(([id, nombre]) => ({id, nombre}))
            );
            resolve();
          },
          error: (err) => { console.error('Error al filtrar obras/proveedores por cliente', err); resolve(); }
        });
        return;
      }

      // Proveedor: traer obras del proveedor → clientes de esas obras
      if (proveedorId) {
        this.filtrosSub?.unsubscribe();
        this.filtrosSub = this.http.get<Array<{id: number; nombre: string}>>(
          `${environment.apiGateway}/bff/reportes/filtros/obras-por-proveedor?proveedorId=${proveedorId}`
        ).pipe(
          switchMap(obras => {
            this.actualizarOpcionesEnFilterBar('obraId', obras);
            if (obras.length === 0) return of([]);
            const climReqs = obras.map(o =>
              this.http.get<Array<{id: number; nombre: string}>>(
                `${environment.apiGateway}/bff/reportes/filtros/clientes-por-obra?obraId=${o.id}`
              )
            );
            return forkJoin(climReqs);
          })
        ).subscribe({
          next: (results: any) => {
            const climSet = new Map<number, string>();
            results.forEach((clientes: any) => clientes.forEach((c: any) => climSet.set(c.id, c.nombre)));
            this.actualizarOpcionesEnFilterBar('clienteId',
              Array.from(climSet.entries()).map(([id, nombre]) => ({id, nombre}))
            );
            resolve();
          },
          error: (err) => { console.error('Error al filtrar obras/clientes por proveedor', err); resolve(); }
        });
        return;
      }

      // Obra: traer proveedores y clientes de esa obra directamente
      if (obraId) {
        this.filtrosSub?.unsubscribe();
        this.filtrosSub = forkJoin([
          this.http.get<Array<{id: number; nombre: string}>>(`${environment.apiGateway}/bff/reportes/filtros/proveedores-por-obra?obraId=${obraId}`),
          this.http.get<Array<{id: number; nombre: string}>>(`${environment.apiGateway}/bff/reportes/filtros/clientes-por-obra?obraId=${obraId}`)
        ]).subscribe({
          next: ([proveedores, clientes]) => {
            this.actualizarOpcionesEnFilterBar('proveedorId', proveedores);
            this.actualizarOpcionesEnFilterBar('clienteId', clientes);
            resolve();
          },
          error: (err) => { console.error('Error al filtrar clientes/proveedores por obra', err); resolve(); }
        });
        return;
      }

      // Sin filtro de entidad: restaurar catálogos completos
      this.setupFilterDefinitions();
      resolve();
    });
  }

  private actualizarOpcionesEnFilterBar(key: string, opciones: Array<{id: number; nombre: string}>): void {
    const idx = this.filterDefinitions.findIndex(f => f.key === key);
    if (idx >= 0) {
      this.filterDefinitions[idx].options = opciones.map(o => ({label: o.nombre, value: o.id}));
    }
  }

  loadCatalogos(): void {
    forkJoin({
      obras: this.obrasService.getObrasSimple('ADJUDICADA,EN_PROGRESO,FINALIZADA').pipe(
        catchError(() => { this.showToast('error', 'Error', 'No se pudieron cargar las obras'); return of([] as Obra[]); })
      ),
      clientes: this.clientesService.getClientesSimple().pipe(
        catchError(() => { this.showToast('error', 'Error', 'No se pudieron cargar los clientes'); return of([] as Cliente[]); })
      ),
      proveedores: this.proveedoresService.getProveedoresSimple().pipe(
        catchError(() => { this.showToast('error', 'Error', 'No se pudieron cargar los proveedores'); return of([] as Proveedor[]); })
      )
    }).subscribe(({obras, clientes, proveedores}) => {
      this.obrasOptions = (obras || []).map((obra) => ({label: obra.nombre, value: obra.id!}));
      this.clientesOptions = (clientes || []).map((cliente) => ({label: cliente.nombre, value: cliente.id}));
      this.proveedoresOptions = (proveedores || []).map((proveedor) => ({label: proveedor.nombre, value: proveedor.id}));
      this.setupFilterDefinitions();
      this.catalogosLoading = false;
    });
  }

  private loadReportes(): void {
    this.loadReportes$().subscribe();
  }

  private loadReportes$(): Observable<void> {
    this.loading = true;

    const filtrosReporte = this.buildReportFilter();
    this.activeFilter = filtrosReporte;

    return forkJoin({
      comisiones: this.withDefault(this.reportesService.getComisiones(filtrosReporte), {
        totalComision: 0,
        totalPagos: 0,
        saldo: 0,
        detalle: []
      }),
      reportesConsolidado: this.withDefault(this.reportesService.reportesConsolidado(filtrosReporte), {
        kpisCuentaCorriente: { cobrado: 0, porCobrar: 0, pagado: 0, porPagar: 0, resultado: 0 },
        facturacionPeriodo: { totalFacturado: 0, totalPorFacturar: 0, detalle: [] },
        movimientosPeriodo: [],
        movimientosPeriodoTotal: 0,
        vencimientosAgenda: []
      } as ReportesConsolidadoResponse)
    }).pipe(
      timeout(30000),
      tap({
        next: (data) => {
          this.comisiones = data.comisiones;
          this.reporteConsolidado = data.reportesConsolidado;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Error cargando reportes:', err);
          this.showToast('error', 'Error', 'No se pudieron cargar los reportes. Intenta nuevamente.');
        }
      }),
      catchError((err) => {
        this.loading = false;
        console.error('Error en loadReportes$:', err);
        return of(void 0);
      }),
      map(() => void 0)
    );
  }

  private buildReportFilter(): ReportFilter | undefined {
    const {obraId, clienteId, proveedorId, fechaInicio, fechaFin} = this.currentFilters;
    const filtro: ReportFilter = {};

    if (obraId) filtro.obraId = obraId;
    if (clienteId) filtro.clienteId = clienteId;
    if (proveedorId) filtro.proveedorId = proveedorId;
    if (fechaInicio) filtro.fechaInicio = this.formatDateValue(fechaInicio);
    if (fechaFin) filtro.fechaFin = this.formatDateValue(fechaFin);

    return Object.keys(filtro).length > 0 ? filtro : undefined;
  }

  private formatDateValue(value: Date): string {
    return formatDate(value, 'yyyy-MM-dd', 'es-AR');
  }

  private withDefault<T>(observable: Observable<T>, defaultValue: T): Observable<T> {
    return observable.pipe(
      catchError(() => {
        this.showToast('warn', 'Advertencia', 'Algunos reportes no pudieron cargarse por completo.');
        return of(defaultValue);
      })
    );
  }

  get totalPresupuestoFacturacion(): number {
    return (this.reporteConsolidado?.facturacionPeriodo?.detalle || [])
      .reduce((sum, item) => sum + Number(item.presupuesto ?? 0), 0);
  }

  private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
    this.messageService.add({severity, summary, detail});
  }

  exportComisionesPdf() {
    const detalle = this.comisiones?.detalle || [];
    const datePipe = new DatePipe('es-AR');
    const hoy = datePipe.transform(new Date(), 'dd/MM/yyyy') ?? '';

    const cell = (text: any, extra: any = {}) => ({ text: String(text ?? ''), fontSize: 9, ...extra });
    const headerCell = (text: string) => cell(text, { bold: true, fillColor: '#f3f4f6', alignment: 'center', fontSize: 9 });

    const filas = detalle.map(item => [
      cell(item.obraNombre || 'General', { alignment: 'left' }),
      cell(item.fecha ? (datePipe.transform(item.fecha, 'dd/MM/yyyy') ?? '-') : '-', { alignment: 'center' }),
      cell(this.formatARS(item.monto), { alignment: 'right' }),
      cell(this.formatARS(item.pagos), { alignment: 'right' }),
      cell(this.formatARS(item.saldo), { alignment: 'right', bold: item.saldo > 0 }),
    ]);

    const docDefinition: any = {
      pageMargins: [30, 40, 30, 40],
      content: [
        { text: 'Reporte de Comisiones', style: 'title', margin: [0, 0, 0, 4] },
        { text: `Generado: ${hoy}`, fontSize: 8, color: '#6b7280', margin: [0, 0, 0, 16] },
        {
          columns: [
            { text: `Total comisiones: ${this.formatARS(this.comisiones?.totalComision ?? 0)}`, fontSize: 10, bold: true },
            { text: `Pagado: ${this.formatARS(this.comisiones?.totalPagos ?? 0)}`, fontSize: 10 },
            { text: `Saldo: ${this.formatARS(this.comisiones?.saldo ?? 0)}`, fontSize: 10, bold: true },
          ],
          margin: [0, 0, 0, 12]
        },
        {
          table: {
            widths: ['*', 70, 80, 80, 80],
            headerRows: 1,
            body: [
              [
                headerCell('OBRA'),
                headerCell('FECHA'),
                headerCell('MONTO'),
                headerCell('PAGADO'),
                headerCell('SALDO'),
              ],
              ...filas
            ]
          },
          layout: {
            fillColor: (ri: number) => ri === 0 ? '#f3f4f6' : ri % 2 === 0 ? '#f9fafb' : null,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          }
        }
      ],
      styles: {
        title: { fontSize: 16, bold: true, color: '#1e293b' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`comisiones_${hoy.replace(/\//g, '-')}.pdf`);
  }

  private formatARS(value: number | null | undefined): string {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(num);
  }

  irAObra(obraId?: number | null) {
    const id = Number(obraId ?? 0);
    if (!Number.isFinite(id) || id <= 0) return;
    this.router.navigate(['/obras', id]);
  }

  pagarComisionReporte(item: { obraId?: number; saldo?: number }): void {
    if (!item?.obraId || Number(item.saldo ?? 0) <= 0 || this.pagandoComisionObraId === item.obraId) return;

    const obraId = item.obraId;
    const monto = Number(item.saldo ?? 0);

    this.confirmationService.confirm({
      message: `¿Registrar el pago de comisión por ${this.formatARS(monto)}?`,
      header: 'Confirmar pago',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Pagar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.pagandoComisionObraId = obraId;
        this.transaccionesService.pagarComision(obraId).subscribe({
          next: () => {
            this.pagandoComisionObraId = null;
            this.showToast('success', 'Comisión pagada', 'El pago se registró correctamente.');
            this.loadReportes();
          },
          error: () => {
            this.pagandoComisionObraId = null;
            this.showToast('error', 'Error', 'No se pudo registrar el pago de la comisión.');
          }
        });
      }
    });
  }
}
