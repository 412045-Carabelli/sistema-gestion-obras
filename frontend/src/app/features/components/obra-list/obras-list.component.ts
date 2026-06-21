import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {DropdownModule} from 'primeng/dropdown';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {MultiSelectModule} from 'primeng/multiselect';

import {Obra} from '../../../core/models/models';
import {ObrasService} from '../../../services/obras/obras.service';
import {Select} from 'primeng/select';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {GenericFilterBarComponent, FilterDefinition} from '../generic-filter-bar/generic-filter-bar.component';

interface EstadoOption {
  label: string;
  value: string;
}

const ESTADOS_CON_FACTURACION = ['ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA'];

const ORDEN_ESTADOS = [
  'PRESUPUESTADA', 'COTIZADA', 'PERDIDA', 'ADJUDICADA',
  'EN_PROGRESO', 'FINALIZADA', 'FACTURADA_PARCIAL', 'FACTURADA', 'COBRADA'
];

@Component({
  selector: 'app-obra-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    DatePipe,
    Select,
    ButtonModule,
    CheckboxModule,
    MultiSelectModule,
    EstadoFormatPipe,
    GenericFilterBarComponent
  ],
  templateUrl: './obras-list.component.html',
  styleUrls: ['./obras-list.component.css']
})
export class ObrasListComponent implements OnInit {
  @Output() obraClick = new EventEmitter<Obra>();

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  datosCargados = false;
  estados: { label: string; name: string }[] = [];

  // Paginación servidor
  totalElements = 0;
  pageSize = 50;
  first = 0;
  private currentPage = -1;

  // Filtros servidor
  estadoFiltro: string[] = [];
  mostrarInactivos = false;
  searchValue = '';

  // Filtros client-side
  estadoFacturacionFiltro: string[] = [];
  clienteSearch = '';

  estadosOptions: EstadoOption[] = [];
  readonly estadosFacturacionOptions: EstadoOption[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Parcial',   value: 'PARCIAL' },
    { label: 'Total',     value: 'TOTAL' },
  ];

  filterDefinitions: FilterDefinition[] = [];
  currentFilters: Record<string, any> = {};

  private estadoInicialDesdeRuta: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private obrasService: ObrasService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const nuevoEstado = this.parseEstadoFiltro(params['estado'] ?? null);
      if (this.datosCargados && JSON.stringify(nuevoEstado) !== JSON.stringify(this.estadoFiltro)) {
        this.estadoFiltro = nuevoEstado;
        this.recargar();
      } else {
        this.estadoFiltro = nuevoEstado;
      }
    });
    this.cargarPagina(0);
  }

  private recargar() {
    this.currentPage = -1;
    this.first = 0;
    this.cargarPagina(0);
  }

  cargarPagina(page: number) {
    this.currentPage = page;
    const filtros: { estado?: string; activo?: boolean; q?: string } = {};
    if (this.estadoFiltro.length === 1) filtros.estado = this.estadoFiltro[0];
    if (!this.mostrarInactivos) filtros.activo = true;
    if (this.searchValue.trim()) filtros.q = this.searchValue.trim();

    this.obrasService.getObrasConDetalles(page, this.pageSize, filtros).subscribe({
      next: resp => {
        this.obras = resp.content;
        this.totalElements = resp.totalElements;
        this.first = page * this.pageSize;

        if (!this.datosCargados && resp.estados?.length) {
          this.estados = this.ordenarEstadosObra(resp.estados);
          this.estadosOptions = this.estados.map(r => ({ label: r.label || r.name, value: r.name }));
          this.setupFilterDefinitions();
        }

        this.aplicarFiltroFacturacion();
        this.datosCargados = true;
      }
    });
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    const page = Math.floor((event.first ?? 0) / this.pageSize);
    if (page === this.currentPage) return; // evita duplicado con carga inicial
    this.cargarPagina(page);
  }

  private aplicarFiltroFacturacion() {
    const clienteQ = this.clienteSearch.trim().toLowerCase();
    this.obrasFiltradas = this.obras.filter(obra => {
      if (this.estadoFacturacionFiltro.length > 0) {
        const ef = this.getEstadoFacturacion(obra);
        if (ef == null || !this.estadoFacturacionFiltro.includes(ef.value)) return false;
      }
      if (clienteQ) {
        const nombreCliente = ((obra as any).cliente?.nombre || '').toLowerCase();
        if (!nombreCliente.includes(clienteQ)) return false;
      }
      return true;
    });
  }

  getEstadoFacturacion(obra: Obra): { label: string; severity: string; value: string } | undefined {
    const estado = this.estadoValorObra(obra).toUpperCase();
    if (!ESTADOS_CON_FACTURACION.includes(estado)) return undefined;

    const ef = (obra as any).estado_financiero as string | undefined;
    if (!ef || ef === 'PENDIENTE') return { label: 'Pendiente', severity: 'warn', value: 'PENDIENTE' };
    if (ef === 'TOTAL') return { label: 'Total', severity: 'success', value: 'TOTAL' };
    if (ef === 'PARCIAL') return { label: 'Parcial', severity: 'info', value: 'PARCIAL' };
    return { label: 'Pendiente', severity: 'warn', value: 'PENDIENTE' };
  }

  private estadoValorObra(obra: any): string {
    const raw = obra?.obra_estado;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (raw.value) return raw.value;
    if (raw.name) return raw.name;
    if (raw.nombre) {
      const rec = this.estados.find(r => (r.label || '').toLowerCase() === (raw.nombre || '').toLowerCase());
      return rec?.name || '';
    }
    return '';
  }

  estadoLabelObra(obra: any): string {
    const raw = obra?.obra_estado;
    if (!raw) return '';
    if (typeof raw === 'string') {
      const rec = this.estados.find(r => ((r.name || '') as string).toUpperCase() === raw.toUpperCase());
      return rec?.label || rec?.name || raw;
    }
    return raw.label || raw.nombre || '';
  }

  getNumeroOrden(obra: Obra): number {
    return Number(obra.id ?? 0);
  }

  getEstadoSeverity(id_estado: number): string {
    const severities: { [key: number]: string } = {
      1: 'secondary', 2: 'info', 3: 'success',
      4: 'success', 5: 'warning', 6: 'contrast', 7: 'danger'
    };
    return severities[id_estado] || 'secondary';
  }

  getProgreso(obra: Obra): number {
    if (!obra.presupuesto || obra.presupuesto === 0) return 0;
    return Math.round(((obra.gastado ?? 0) / obra.presupuesto) * 100);
  }

  onRowClick(obra: Obra) {
    this.obraClick.emit(obra);
    this.router.navigate(['/obras', obra.id]);
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    const nuevoSearch = filters['search'] || '';
    const nuevoEstado = filters['estado']
      ? (Array.isArray(filters['estado']) ? filters['estado'] : [filters['estado']])
      : [];
    const nuevoInactivos = filters['mostrarInactivos'] || false;
    const nuevoFacturacion = filters['facturacion']
      ? (Array.isArray(filters['facturacion']) ? filters['facturacion'] : [filters['facturacion']])
      : [];
    const nuevoClienteSearch = filters['clienteSearch'] || '';

    const serverFiltrosChanged =
      nuevoSearch !== this.searchValue ||
      JSON.stringify(nuevoEstado) !== JSON.stringify(this.estadoFiltro) ||
      nuevoInactivos !== this.mostrarInactivos;

    this.searchValue = nuevoSearch;
    this.estadoFiltro = nuevoEstado;
    this.mostrarInactivos = nuevoInactivos;
    this.estadoFacturacionFiltro = nuevoFacturacion;
    this.clienteSearch = nuevoClienteSearch;

    if (serverFiltrosChanged) {
      this.recargar();
    } else {
      this.aplicarFiltroFacturacion();
    }
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.searchValue = '';
    this.estadoFiltro = [];
    this.estadoFacturacionFiltro = [];
    this.clienteSearch = '';
    this.mostrarInactivos = false;
    this.recargar();
  }

  private parseEstadoFiltro(raw: string | string[] | null): string[] {
    if (!raw) return [];
    const values = Array.isArray(raw) ? raw : raw.split(',');
    return values.map(v => (v || '').toString().trim().toUpperCase()).filter(Boolean);
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      { key: 'clienteSearch', label: 'Cliente', type: 'input', placeholder: 'Por nombre de cliente' },
      { key: 'search', label: 'Obra', type: 'input', placeholder: 'Por nombre o dirección' },
      { key: 'estado', label: 'Estado', type: 'select', placeholder: 'Todos', options: this.estadosOptions },
      { key: 'facturacion', label: 'Facturación', type: 'select', placeholder: 'Todos', options: this.estadosFacturacionOptions },
      { key: 'mostrarInactivos', label: 'Ver inactivos', type: 'checkbox' }
    ];
  }

  private ordenarEstadosObra(records: { label: string; name: string }[]): { label: string; name: string }[] {
    const index = new Map(ORDEN_ESTADOS.map((e, i) => [e, i]));
    const norm = (v?: string | null) => (v || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
    return [...(records || [])].sort((a, b) => {
      const aKey = index.get(norm(a?.name || a?.label)) ?? 999;
      const bKey = index.get(norm(b?.name || b?.label)) ?? 999;
      if (aKey !== bKey) return aKey - bKey;
      return (a?.label || '').localeCompare(b?.label || '');
    });
  }
}
