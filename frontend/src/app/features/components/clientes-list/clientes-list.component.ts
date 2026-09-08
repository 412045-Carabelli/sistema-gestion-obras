import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {CheckboxModule} from 'primeng/checkbox';
import {TooltipModule} from 'primeng/tooltip';
import {Select} from 'primeng/select';
import {forkJoin} from 'rxjs';

import {Cliente, CondicionIva, CONDICION_IVA_LABELS} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {GenericFilterBarComponent, FilterDefinition, FilterAction} from '../generic-filter-bar/generic-filter-bar.component';
import {TableSkeletonComponent} from '../../../shared/table-skeleton/table-skeleton.component';
import {exportarListadoPdf} from '../../../shared/utils/pdf-export.util';

interface SaldoOption { label: string; value: 'todos' | 'con_saldo' | 'saldo_cero_o_menor'; }

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    TableModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    TooltipModule,
    Select,
    GenericFilterBarComponent,
    TableSkeletonComponent
  ],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css']
})
export class ClientesListComponent implements OnInit {
  @Input() clientes: Cliente[] = [];
  @Output() clienteClick = new EventEmitter<Cliente>();

  clientesFiltrados: Cliente[] = [];
  datosCargados = false;
  saldoOptions: SaldoOption[] = [
    {label: 'Todos', value: 'todos'},
    {label: 'Con saldo', value: 'con_saldo'},
    {label: 'Saldo = 0 o < 0', value: 'saldo_cero_o_menor'}
  ];
  saldosCliente: Record<number, number> = {};
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [
    { label: 'Exportar PDF', icon: 'pi pi-file-pdf', severity: 'danger', callback: () => this.exportarPdf() }
  ];

  searchValue: string = '';
  saldoFiltro: 'todos' | 'con_saldo' | 'saldo_cero_o_menor' = 'todos';
  mostrarInactivos = false;

  currentPage = 0;
  pageSize = 50;
  totalElements = 0;

  constructor(
    private router: Router,
    private clientesService: ClientesService,
    private reportesService: ReportesService
  ) {
  }

  ngOnInit() {
    forkJoin({
      clientesPage: this.clientesService.getClientesConDetalles(this.currentPage, this.pageSize),
      deudas: this.reportesService.getDeudasGlobales({incluirSaldoCero: true})
    }).subscribe({
      next: ({clientesPage, deudas}) => {
        this.clientes = (clientesPage.content || []).map((c: Cliente) => ({...c, id: Number(c.id)}));
        this.totalElements = clientesPage.totalElements || 0;
        (deudas.detalleDeudaClientes ?? []).forEach(d => {
          const id = Number(d.clienteId ?? 0);
          if (!id) return;
          this.saldosCliente[id] = (this.saldosCliente[id] ?? 0) + Number(d.saldo ?? 0);
        });

        this.setupFilterDefinitions();
        this.applyFilter();
        this.datosCargados = true;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.datosCargados = true;
      }
    });

    // Defer will auto-prefetch after 2s and load on interaction
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      {
        key: 'search',
        label: 'Buscar',
        type: 'input',
        placeholder: 'Nombre, contacto, email...'
      },
      {
        key: 'saldo',
        label: 'Saldo',
        type: 'select',
        placeholder: 'Todos',
        options: this.saldoOptions.map((s) => ({ label: s.label, value: s.value }))
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.searchValue = filters['search'] || '';
    this.saldoFiltro = filters['saldo'] || 'todos';
    this.applyFilter();
  }

  onClearFilters(): void {
    this.searchValue = '';
    this.saldoFiltro = 'todos';
    this.mostrarInactivos = false;
    this.applyFilter();
  }

  obtenerSaldoCliente(id?: number): number {
    if (!id) return 0;
    return this.saldosCliente[id] ?? 0;
  }

  // 🔍 Filtrado por búsqueda y activo
  applyFilter() {
    this.clientesFiltrados = this.clientes
      .filter(cliente => {
      const matchesSearch = this.searchValue
        ? cliente.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (cliente.contacto?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.direccion?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.cuit?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.telefono?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.email?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false)
        : true;

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(cliente.activo ?? true);

      const saldo = this.obtenerSaldoCliente(cliente.id);
      const matchesSaldo =
        this.saldoFiltro === 'todos'
          ? true
          : this.saldoFiltro === 'con_saldo'
            ? saldo > 0.01
            : saldo <= 0.01;

      return matchesSearch && matchesActivo && matchesSaldo;
    })
      .sort((a, b) => this.compararTexto(a.nombre, b.nombre));
  }

  onMostrarInactivosChange() {
    this.applyFilter();
  }

  onRowClick(cliente: Cliente) {
    this.clienteClick.emit(cliente);
    this.router.navigate(['/clientes', cliente.id]);
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getCondicionIvaLabel(condicion: CondicionIva | string | null | undefined): string {
    if (!condicion) return 'Sin dato';

    const normalized = condicion.toString().trim();
    const key = normalized.toUpperCase().replace(/\s+/g, '_') as CondicionIva;

    return CONDICION_IVA_LABELS[key] ?? normalized;
  }

  toggleActivo(cliente: Cliente, event: Event) {
    event.stopPropagation();
    const accion$ = cliente.activo
      ? this.clientesService.desactivar(cliente.id)
      : this.clientesService.activar(cliente.id);

    accion$.subscribe(() => {
      cliente.activo = !cliente.activo;
      this.applyFilter();
    });
  }

  private compararTexto(a?: string | null, b?: string | null): number {
    return (a || '').localeCompare(b || '', 'es', {sensitivity: 'base'});
  }

  private exportarPdf(): void {
    const columnas = ['Nombre', 'Contacto', 'Teléfono', 'Email', 'CUIT', 'Condición IVA', 'Activo'];
    const filas = this.clientesFiltrados.map(c => [
      c.nombre,
      c.contacto || '-',
      c.telefono || '-',
      c.email || '-',
      c.cuit || '-',
      this.getCondicionIvaLabel(c.condicionIva ?? c.condicion_iva),
      c.activo ? 'Sí' : 'No'
    ]);
    exportarListadoPdf({
      titulo: 'Listado de Clientes',
      columnas,
      filas,
      nombreArchivo: 'listado-clientes'
    });
  }
}
