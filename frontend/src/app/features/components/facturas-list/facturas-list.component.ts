import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
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
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';
import {FileUploadModule} from 'primeng/fileupload';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';

import {Cliente, Factura, Obra} from '../../../core/models/models';
import {FacturasService, FacturasResumenResponse} from '../../../services/facturas/facturas.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {FacturasStateService} from '../../../services/facturas/facturas-state.service';
import {GenericFilterBarComponent, FilterDefinition} from '../generic-filter-bar/generic-filter-bar.component';
import {KpiCardComponent} from '../../../shared/kpi-card/kpi-card.component';

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
    FormsModule,
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
    InputNumber,
    DatePicker,
    FileUploadModule,
    ModalComponent,
    ConfirmDialog,
    GenericFilterBarComponent,
    KpiCardComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-list.component.html',
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit, OnDestroy {
  @Output() facturaClick = new EventEmitter<Factura>();

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

  // Modal nueva factura
  showFacturaModal = false;
  facturaForm: {
    id_cliente: number | null;
    id_obra: number | null;
    fecha: Date;
    monto: number | null;
    descripcion: string;
    estado: string;
  } = {
    id_cliente: null,
    id_obra: null,
    fecha: new Date(),
    monto: null,
    descripcion: '',
    estado: 'EMITIDA'
  };
  facturaObrasFiltradas: Obra[] = [];
  facturaFile: File | null = null;
  facturaRestanteObra: number | null = null;

  // Filter Bar
  filterDefinitions: FilterDefinition[] = [];
  currentFilters: Record<string, any> = {};

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private facturasService: FacturasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private facturasStateService: FacturasStateService
  ) {
  }

  ngOnInit() {
    this.setupFilterDefinitions();
    this.subscription.add(
      this.facturasStateService.openCreateModal$.subscribe(() => this.abrirFacturaModal())
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
        placeholder: 'Por cliente, obra o nro. de factura'
      },
      {
        key: 'cliente',
        label: 'Cliente',
        type: 'select',
        placeholder: 'Todos',
        options: this.clientes.map((c) => ({ label: c.nombre, value: c.id }))
      },
      {
        key: 'obra',
        label: 'Obra',
        type: 'select',
        placeholder: 'Todas',
        options: this.obras.map((o) => ({ label: o.nombre, value: o.id }))
      },
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
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));

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
    this.router.navigate(['/facturas', factura.id]);
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

  get facturaFormInvalid(): boolean {
    return !this.facturaForm.id_cliente || !this.facturaForm.id_obra || !this.facturaForm.monto;
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
    window.open(this.facturasService.getFacturaUrl(factura.id), '_blank', 'noopener');
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

  // --- Modal nueva factura ---

  abrirFacturaModal() {
    this.resetFacturaForm();
    this.facturaObrasFiltradas = this.obras.filter(o => this.esObraDisponibleParaFacturar(o));
    this.showFacturaModal = true;
  }

  cerrarFacturaModal() {
    this.showFacturaModal = false;
  }

  onFacturaClienteChange() {
    if (!this.facturaForm.id_cliente) {
      this.facturaObrasFiltradas = this.obras.filter(o => this.esObraDisponibleParaFacturar(o));
      this.facturaForm.id_obra = null;
      this.facturaRestanteObra = null;
      return;
    }
    this.facturaObrasFiltradas = this.obras.filter(o =>
      Number(o.id_cliente || o.cliente?.id) === Number(this.facturaForm.id_cliente) && this.esObraDisponibleParaFacturar(o)
    );
    this.facturaForm.id_obra = null;
    this.facturaRestanteObra = null;
  }

  onFacturaObraChange() {
    const obraId = this.facturaForm.id_obra;
    if (!obraId) {
      this.facturaRestanteObra = null;
      return;
    }
    this.actualizarRestanteFacturaObra(Number(obraId));
  }

  onFacturaFileSelected(event: any) {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.facturaFile = files?.[0] ?? null;
  }

  quitarFacturaArchivo() {
    this.facturaFile = null;
  }

  guardarFactura() {
    if (!this.facturaForm.id_cliente) {
      this.messageService.add({severity: 'warn', summary: 'Campo requerido', detail: 'Selecciona un cliente.'});
      return;
    }
    const monto = Number(this.facturaForm.monto ?? 0);
    if (!monto || monto <= 0) {
      this.messageService.add({severity: 'warn', summary: 'Monto invalido', detail: 'Ingresa un monto mayor a 0.'});
      return;
    }
    if (this.facturaRestanteObra != null && monto > this.facturaRestanteObra + 0.01) {
      this.messageService.add({severity: 'warn', summary: 'Monto invalido', detail: 'El monto supera el restante disponible de la obra.'});
      return;
    }
    const estado = (this.facturaForm.estado || 'EMITIDA').toUpperCase();
    const payload = {
      id_cliente: Number(this.facturaForm.id_cliente),
      id_obra: this.facturaForm.id_obra != null ? Number(this.facturaForm.id_obra) : null,
      monto,
      monto_restante: estado === 'COBRADA' ? 0 : monto,
      fecha: this.formatDate(this.facturaForm.fecha),
      descripcion: this.facturaForm.descripcion || '',
      estado: this.facturaForm.estado || 'EMITIDA'
    };
    this.facturasService.createFactura(payload, this.facturaFile).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Factura creada', detail: 'La factura se guardo correctamente.'});
        this.cerrarFacturaModal();
        this.resetFacturaForm();
        this.cargarDatos();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo crear la factura.';
        this.messageService.add({severity: 'error', summary: 'Error', detail});
      }
    });
  }

  private resetFacturaForm() {
    this.facturaForm = {
      id_cliente: null,
      id_obra: null,
      fecha: new Date(),
      monto: null,
      descripcion: '',
      estado: 'EMITIDA'
    };
    this.facturaFile = null;
    this.facturaRestanteObra = null;
  }

  private esObraDisponibleParaFacturar(obra: Obra): boolean {
    if (!Boolean(obra.requiere_factura) || !Boolean(obra.activo ?? true)) {
      return false;
    }
    // Verificar que el estado esté en los permitidos
    const estadoNormalizado = this.sanitizarEstado(String(obra.obra_estado || ''));
    return this.ESTADOS_PERMITIDOS.includes(estadoNormalizado);
  }

  private actualizarRestanteFacturaObra(obraId: number) {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.facturaRestanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: (facturas) => {
        const facturado = (facturas || []).reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.facturaRestanteObra = Math.max(0, presupuesto - facturado);
      },
      error: () => {
        this.facturaRestanteObra = null;
      }
    });
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

 
}
