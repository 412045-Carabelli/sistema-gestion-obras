import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {forkJoin} from 'rxjs';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {Subscription} from 'rxjs';
import {CheckboxModule} from 'primeng/checkbox';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';

import {Cliente, Factura, Obra} from '../../../core/models/models';
import {FacturasService, FacturasResumenResponse} from '../../../services/facturas/facturas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {FacturaModalComponent} from '../factura-modal/factura-modal.component';
import {FacturasStateService} from '../../../services/facturas/facturas-state.service';
import {GenericFilterBarComponent, FilterDefinition, FilterAction} from '../generic-filter-bar/generic-filter-bar.component';
import {KpiCardComponent} from '../../../shared/kpi-card/kpi-card.component';
import {exportarListadoPdf} from '../../../shared/utils/pdf-export.util';

interface FacturaView extends Factura {
  clienteNombre?: string;
  obraNombre?: string;
  porCobrarObra?: number;
  porFacturarObra?: number;
  descripcionTexto?: string;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    Select,
    ProgressSpinnerModule,
    TooltipModule,
    TagModule,
    CurrencyPipe,
    DatePipe,
    CheckboxModule,
    EstadoFormatPipe,
    ToastModule,
    FacturaModalComponent,
    ConfirmDialog,
    GenericFilterBarComponent,
    KpiCardComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-list.component.html',
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit, OnDestroy {
  /** Cuando se setea, el listado queda acotado a esta obra (usado embebido en Obras/Detalle). */
  @Input() obraId?: number;
  @Output() facturaClick = new EventEmitter<Factura>();

  /** Obra + cliente ya cargados cuando el listado está acotado a una obra; se pasa al modal para bloquear los selects sin pegarle a /bff/clientes ni /bff/obras. */
  obraActual: Obra | null = null;

  // Estados permitidos para facturación (deben coincidir con backend)
  private readonly ESTADOS_PERMITIDOS = [
    'ADJUDICADA',
    'EN_PROGRESO',
    'FINALIZADA',
    'COBRADA',
    'FACTURADA',
    'FACTURADA_PARCIAL',
    'FACTURADA_TOTAL'
  ];

  facturas: FacturaView[] = [];
  facturasFiltradas: FacturaView[] = [];
  obrasFacturacion: Array<{
    id: number;
    nombre: string;
    clienteNombre: string;
    estado: string;
    presupuesto: number;
    facturado: number;
    porFacturar: number;
    facturas: FacturaView[];
  }> = [];
  obrasFacturacionFiltradas: Array<{
    id: number;
    nombre: string;
    clienteNombre: string;
    estado: string;
    presupuesto: number;
    facturado: number;
    porFacturar: number;
    facturas: FacturaView[];
  }> = [];
  clientes: Cliente[] = [];
  obras: Obra[] = [];
  facturadoPorObra: Record<number, number> = {};
  presupuestoPorObra: Record<number, number> = {};
  private obrasById = new Map<number, Obra>();
  private clientesIndex = new Map<number, string>();

  searchValue: string = '';
  clienteFiltro: number | 'todos' = 'todos';
  obraFiltro: number | 'todos' = 'todos';
  mostrarInactivos = false;
  estadoFiltro: string | 'todos' = 'todos';
  clientesOptions: SelectOption<number | 'todos'>[] = [];
  obrasOptions: SelectOption<number | 'todos'>[] = [];
  estadosOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'Emitida', value: 'EMITIDA' },
    { label: 'Cobrada', value: 'COBRADA' }
  ];
  datosCargados = false;
  kpis: FacturasResumenResponse['kpis'] = { totalFacturado: 0, totalCobrado: 0, totalPorCobrar: 0, totalPorFacturar: 0 };

  // Modal de factura (alta/detalle/edicion unificados)
  modalVisible = false;
  modalMode: 'crear' | 'detalle' = 'crear';
  modalFacturaId: number | null = null;

  // Filter Bar
  filterDefinitions: FilterDefinition[] = [];
  currentFilters: Record<string, any> = {};
  filterActions: FilterAction[] = [
    { label: 'Exportar PDF', icon: 'pi pi-file-pdf', severity: 'danger', callback: () => this.exportarPdf() }
  ];

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private facturasService: FacturasService,
    private obrasService: ObrasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private facturasStateService: FacturasStateService
  ) {
  }

  ngOnInit() {
    this.setupFilterDefinitions();
    this.subscription.add(
      this.facturasStateService.openCreateModal$.subscribe(() => this.abrirModalCrear())
    );
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      {
        key: 'search',
        label: 'Buscar',
        type: 'input',
        placeholder: this.obraId ? 'Por nro. de factura' : 'Por cliente, obra o nro. de factura'
      },
      // Cliente y Obra no aplican cuando el listado ya está acotado a una obra puntual.
      ...(this.obraId ? [] : [
        {
          key: 'cliente',
          label: 'Cliente',
          type: 'select' as const,
          placeholder: 'Todos',
          options: this.clientes.map((c) => ({ label: c.nombre, value: c.id }))
        },
        {
          key: 'obra',
          label: 'Obra',
          type: 'select' as const,
          placeholder: 'Todas',
          options: this.obras.map((o) => ({ label: o.nombre, value: o.id }))
        }
      ]),
      {
        key: 'estado',
        label: 'Estado',
        type: 'select',
        placeholder: 'Todos',
        options: this.estadosOptions
      },
      {
        key: 'mostrarInactivos',
        label: 'Ver inactivos',
        type: 'checkbox'
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.searchValue = filters['search'] || '';
    this.clienteFiltro = filters['cliente'] || 'todos';
    this.obraFiltro = filters['obra'] || 'todos';
    this.estadoFiltro = filters['estado'] || 'todos';
    this.mostrarInactivos = filters['mostrarInactivos'] || false;
    this.applyFilter();
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.searchValue = '';
    this.clienteFiltro = 'todos';
    this.obraFiltro = 'todos';
    this.estadoFiltro = 'todos';
    this.mostrarInactivos = false;
    this.applyFilter();
  }

  private cargarDatos() {
    this.datosCargados = false;
    if (this.obraId) {
      this.cargarDatosObra(this.obraId);
      return;
    }
    this.facturasService.getResumen().subscribe({
      next: (resumen) => {
        this.kpis = resumen.kpis;
        this.clientes = resumen.clientes.map(c => ({...c, id: Number(c.id)}) as Cliente);
        this.obras = resumen.obras as unknown as Obra[];

        this.clientesIndex = new Map<number, string>(
          this.clientes.map(c => [Number(c.id), c.nombre])
        );
        this.obrasById = new Map<number, Obra>(
          this.obras.filter(o => o.id !== undefined).map(o => [Number(o.id), o])
        );
        this.facturadoPorObra = resumen.obrasFacturacion.reduce((acc, o) => {
          acc[o.id] = o.facturado;
          return acc;
        }, {} as Record<number, number>);
        this.presupuestoPorObra = resumen.obrasFacturacion.reduce((acc, o) => {
          acc[o.id] = o.presupuesto;
          return acc;
        }, {} as Record<number, number>);

        this.facturas = (resumen.facturas || []).map(f => ({
          ...f,
          clienteNombre: (f as any).nombre_cliente || 'Sin cliente',
          obraNombre: (f as any).nombre_obra || 'Sin obra',
          porCobrarObra: this.obtenerPorCobrarFactura(f),
          descripcionTexto: this.stripHtml(f.descripcion)
        }));

        this.obrasFacturacion = resumen.obrasFacturacion.map(o => ({
          ...o,
          facturas: (o.facturas || []).map(f => ({
            ...f,
            clienteNombre: (f as any).nombre_cliente || o.clienteNombre,
            obraNombre: (f as any).nombre_obra || o.nombre,
            porCobrarObra: this.obtenerPorCobrarFactura(f),
            descripcionTexto: this.stripHtml(f.descripcion)
          })) as FacturaView[]
        }));

        this.clientesOptions = [
          {label: 'Todos', value: 'todos'},
          ...this.clientes.map(c => ({label: c.nombre, value: Number(c.id)}))
        ];
        this.updateObrasOptions();
        this.setupFilterDefinitions();
        this.applyFilter();
        this.datosCargados = true;
      },
      error: () => {
        this.datosCargados = true;
      }
    });
  }

  /** Carga acotada a una sola obra (uso embebido en Obras/Detalle): evita traer el resumen global. */
  private cargarDatosObra(obraId: number): void {
    forkJoin({
      facturas: this.facturasService.getFacturasByObra(obraId),
      obra: this.obrasService.getObraById(obraId)
    }).subscribe({
      next: ({facturas, obra}) => {
        const clienteObra = (obra as any).cliente as Cliente | undefined;
        this.clientes = clienteObra ? [clienteObra] : [];
        this.obras = [obra as Obra];
        this.obraActual = obra as Obra;
        this.obrasById = new Map<number, Obra>([[Number(obra.id), obra as Obra]]);
        this.clientesIndex = clienteObra ? new Map([[Number(clienteObra.id), clienteObra.nombre]]) : new Map();

        this.facturas = (facturas || []).map(f => ({
          ...f,
          clienteNombre: clienteObra?.nombre || 'Sin cliente',
          obraNombre: obra.nombre,
          porCobrarObra: this.obtenerPorCobrarFactura(f),
          descripcionTexto: this.stripHtml(f.descripcion)
        }));

        const totalFacturado = this.facturas.reduce((sum, f) => sum + Number(f.monto || 0), 0);
        const totalCobrado = this.facturas
          .filter(f => (f.estado || '').toUpperCase() === 'COBRADA')
          .reduce((sum, f) => sum + Number(f.monto || 0), 0);
        const totalPorCobrar = this.facturas.reduce((sum, f) => sum + (f.porCobrarObra || 0), 0);
        const presupuesto = Number(obra.presupuesto ?? 0);
        const totalPorFacturar = Boolean(obra.requiere_factura) ? Math.max(0, presupuesto - totalFacturado) : 0;
        this.kpis = {totalFacturado, totalCobrado, totalPorCobrar, totalPorFacturar};

        this.clientesOptions = clienteObra
          ? [{label: 'Todos', value: 'todos'}, {label: clienteObra.nombre, value: Number(clienteObra.id)}]
          : [{label: 'Todos', value: 'todos'}];
        this.updateObrasOptions();
        this.setupFilterDefinitions();
        this.applyFilter();
        this.datosCargados = true;
      },
      error: () => {
        this.datosCargados = true;
      }
    });
  }

  applyFilter() {
    this.facturasFiltradas = this.facturas
      .filter(factura => {
      const search = this.searchValue.trim().toLowerCase();
      const matchesSearch = search
        ? (factura.clienteNombre || '').toLowerCase().includes(search) ||
        (factura.obraNombre || '').toLowerCase().includes(search) ||
        String(factura.id || '').includes(search)
        : true;

      const matchesCliente =
        this.clienteFiltro === 'todos'
          ? true
          : Number(factura.id_cliente) === Number(this.clienteFiltro);

      const matchesObra =
        this.obraFiltro === 'todos'
          ? true
          : Number(factura.id_obra) === Number(this.obraFiltro);

      const matchesEstado =
        this.estadoFiltro === 'todos'
          ? true
          : (factura.estado || '').toUpperCase() === this.estadoFiltro;

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(factura.activo ?? true);

      return matchesSearch && matchesCliente && matchesObra && matchesEstado && matchesActivo;
    })
      .sort((a, b) => new Date(b.fecha ?? 0).getTime() - new Date(a.fecha ?? 0).getTime());

    this.obrasFacturacionFiltradas = this.obrasFacturacion
      .filter(obra => {
        const search = this.searchValue.trim().toLowerCase();
        const matchesSearch = search
          ? (obra.clienteNombre || '').toLowerCase().includes(search) ||
            (obra.nombre || '').toLowerCase().includes(search) ||
            String(obra.id || '').includes(search)
          : true;
        const matchesCliente =
          this.clienteFiltro === 'todos'
            ? true
            : Number(this.obrasById.get(obra.id)?.id_cliente || this.obrasById.get(obra.id)?.cliente?.id) === Number(this.clienteFiltro);
        const matchesObra =
          this.obraFiltro === 'todos'
            ? true
            : Number(obra.id) === Number(this.obraFiltro);
        return matchesSearch && matchesCliente && matchesObra;
      })
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
  }

  onClienteChange() {
    this.updateObrasOptions();
    this.applyFilter();
  }

  private updateObrasOptions() {
    const obrasFuente =
      this.clienteFiltro === 'todos'
        ? this.obras
        : this.obras.filter(o => Number(o.id_cliente || o.cliente?.id) === Number(this.clienteFiltro));

    this.obrasOptions = [
      {label: 'Todas', value: 'todos'},
      ...obrasFuente
        .filter(o => o.id !== undefined)
        .map(o => ({label: o.nombre, value: Number(o.id)}))
    ];

    if (
      this.obraFiltro !== 'todos' &&
      !obrasFuente.some(o => Number(o.id) === Number(this.obraFiltro))
    ) {
      this.obraFiltro = 'todos';
    }
  }

  onRowClick(factura: FacturaView) {
    this.facturaClick.emit(factura);
    this.abrirModalDetalle(Number(factura.id));
  }

  irAlObraDetalle(obraId: number) {
    this.router.navigate(['/obras', obraId], { queryParams: { tab: '3' } });
  }


  get totalFacturado(): number {
    return Number(this.kpis.totalFacturado ?? 0);
  }

  get totalPorFacturar(): number {
    return Number(this.kpis.totalPorFacturar ?? 0);
  }

  get totalCobrado(): number {
    return Number(this.kpis.totalCobrado ?? 0);
  }

  get totalPorCobrar(): number {
    return Number(this.kpis.totalPorCobrar ?? 0);
  }

  private get facturasScope(): FacturaView[] {
    if (this.obraFiltro !== 'todos') {
      return this.facturas.filter(f => Number(f.id_obra) === Number(this.obraFiltro));
    }
    if (this.clienteFiltro !== 'todos') {
      return this.facturas.filter(f => Number(f.id_cliente) === Number(this.clienteFiltro));
    }
    return this.facturas;
  }

  private get obrasScope(): Obra[] {
    if (this.obraFiltro !== 'todos') {
      return this.obras.filter(o => Number(o.id) === Number(this.obraFiltro));
    }
    if (this.clienteFiltro !== 'todos') {
      return this.obras.filter(o => Number(o.id_cliente || o.cliente?.id) === Number(this.clienteFiltro));
    }
    return this.obras;
  }

  private obraEsFacturable(idObra?: number | null): boolean {
    const id = Number(idObra ?? 0);
    if (!id) return false;
    const obra = this.obrasById.get(id);
    if (!obra || !Boolean(obra.activo ?? true)) return false;
    if (!Boolean(obra.requiere_factura)) return false;

    // Verificar que el estado esté en los permitidos
    const estadoNormalizado = this.sanitizarEstado(String(obra.obra_estado || ''));
    return this.ESTADOS_PERMITIDOS.includes(estadoNormalizado);
  }

  verAdjunto(factura: FacturaView, event: Event) {
    event.stopPropagation();
    if (!factura?.id || !factura?.nombre_archivo) return;
    const popup = window.open('', '_blank');
    if (popup) {
      popup.opener = null;
      popup.document.write('<p>Cargando adjunto...</p>');
    } else {
      this.messageService.add({severity: 'warn', summary: 'Bloqueo de ventana', detail: 'Habilitá los pop-ups para ver el adjunto.'});
      return;
    }
    this.facturasService.downloadFactura(factura.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        popup.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        popup.close();
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo abrir el adjunto.'});
      }
    });
  }

  eliminarFactura(factura: FacturaView, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Eliminar factura',
      message: `¿Seguro que querés eliminar la Factura #${factura.id}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.facturasService.deleteFactura(Number(factura.id)).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Factura eliminada', detail: `Factura #${factura.id} eliminada.`});
            this.cargarDatos();
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la factura.'});
          }
        });
      }
    });
  }

  getSiguienteEstadoFacturaIcon(factura: FacturaView): string {
    return (factura.estado || 'EMITIDA').toUpperCase() === 'COBRADA' ? 'pi pi-replay' : 'pi pi-check-circle';
  }

  getSiguienteEstadoFacturaLabel(factura: FacturaView): string {
    return (factura.estado || 'EMITIDA').toUpperCase() === 'COBRADA' ? 'Revertir a emitida' : 'Marcar como cobrada';
  }

  toggleEstadoFactura(factura: FacturaView, event?: Event) {
    event?.stopPropagation();
    if (!factura?.id) return;
    const estadoActual = (factura.estado || 'EMITIDA').toString().toUpperCase();
    const nuevoEstado = estadoActual === 'COBRADA' ? 'EMITIDA' : 'COBRADA';
    const payload = {
      id_cliente: Number(factura.id_cliente),
      id_obra: factura.id_obra != null ? Number(factura.id_obra) : null,
      monto: Number(factura.monto || 0),
      monto_restante: nuevoEstado === 'COBRADA' ? 0 : this.obtenerPorCobrarFactura(factura),
      fecha: this.formatDate(factura.fecha),
      descripcion: factura.descripcion || '',
      estado: nuevoEstado,
      // impacta_cta_cte: factura.impacta_cta_cte ?? false
    };

    this.facturasService.updateFactura(Number(factura.id), payload).subscribe({
      next: (updated) => {
        this.facturas = this.facturas.map(f => {
          if (Number(f.id) !== Number(factura.id)) return f;
          const porCobrar = this.obtenerPorCobrarFactura({...f, ...updated});
          return {...f, ...updated, porCobrarObra: porCobrar};
        });
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Factura marcada como ${nuevoEstado === 'COBRADA' ? 'cobrada' : 'emitida'}.`
        });
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo actualizar el estado de la factura.'
        });
      }
    });
  }

  private obtenerPorCobrarFactura(factura: Factura): number {
    const estado = (factura.estado || 'EMITIDA').toString().toUpperCase();
    if (estado === 'COBRADA') return 0;
    const restante = Number((factura as any).monto_restante ?? NaN);
    if (Number.isFinite(restante) && restante > 0) return restante;
    return Number(factura.monto ?? 0);
  }


  private normalizarEstado(raw: any): string {
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

  // --- Modal de factura (alta/detalle/edicion) ---

  abrirModalCrear() {
    this.modalMode = 'crear';
    this.modalFacturaId = null;
    this.modalVisible = true;
  }

  abrirModalDetalle(facturaId: number) {
    this.modalMode = 'detalle';
    this.modalFacturaId = facturaId;
    this.modalVisible = true;
  }

  onModalClosed() {
    this.modalVisible = false;
  }

  onFacturaGuardada() {
    this.cargarDatos();
  }

  onFacturaEliminada() {
    this.cargarDatos();
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value).split('T')[0];
  }
  private stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private exportarPdf(): void {
    const columnas = ['N°', 'Cliente', 'Obra', 'Fecha', 'Monto', 'Estado'];
    const filas = this.facturasFiltradas.map(f => [
      f.id ?? '-',
      f.clienteNombre || '-',
      f.obraNombre || '-',
      f.fecha ? new Date(f.fecha).toLocaleDateString('es-AR') : '-',
      `$ ${Number(f.monto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      f.estado || '-'
    ]);
    exportarListadoPdf({
      titulo: 'Listado de Facturas',
      columnas,
      filas,
      nombreArchivo: 'listado-facturas'
    });
  }
}
