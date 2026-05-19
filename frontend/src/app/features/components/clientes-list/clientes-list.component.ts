import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {forkJoin} from 'rxjs';

import {Cliente, CondicionIva, CONDICION_IVA_LABELS} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {GenericFilterBarComponent, FilterDefinition} from '../generic-filter-bar/generic-filter-bar.component';

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
    ButtonModule,
    CheckboxModule,
    Select,
    GenericFilterBarComponent
  ],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css']
})
export class ClientesListComponent implements OnInit {
  @Input() clientes: Cliente[] = [];
  @Output() clienteClick = new EventEmitter<Cliente>();

  clientesFiltrados: Cliente[] = [];
  datosCargados = false;
  ivaOptions: { label: string; name: string }[] = [];
  filterDefinitions: FilterDefinition[] = [];

  searchValue: string = '';
  condicionIvaFiltro: string | 'todos' = 'todos';
  mostrarInactivos = false;

  currentPage = 0;
  pageSize = 50;
  totalElements = 0;

  constructor(
    private router: Router,
    private clientesService: ClientesService
  ) {
  }

  ngOnInit() {
    forkJoin({
      clientesPage: this.clientesService.getClientesConDetalles(this.currentPage, this.pageSize),
      condicionesIva: this.clientesService.getCondicionesIva()
    }).subscribe({
      next: ({clientesPage, condicionesIva}) => {
        this.clientes = (clientesPage.content || []).map((c: Cliente) => ({...c, id: Number(c.id)}));
        this.totalElements = clientesPage.totalElements || 0;
        this.ivaOptions = [
          {label: 'Todas', name: 'todos'},
          ...condicionesIva
        ];

        this.setupFilterDefinitions(condicionesIva);
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

  private setupFilterDefinitions(condicionesIva: { label: string; name: string }[]): void {
    this.filterDefinitions = [
      {
        key: 'search',
        label: 'Buscar',
        type: 'input',
        placeholder: 'Nombre, contacto, email...'
      },
      {
        key: 'condicionIva',
        label: 'Condición IVA',
        type: 'select',
        placeholder: 'Todas',
        options: [
          { label: 'Todas', value: 'todos' },
          ...condicionesIva.map((c) => ({ label: c.label, value: c.name }))
        ]
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.searchValue = filters['search'] || '';
    this.condicionIvaFiltro = filters['condicionIva'] || 'todos';
    this.applyFilter();
  }

  onClearFilters(): void {
    this.searchValue = '';
    this.condicionIvaFiltro = 'todos';
    this.mostrarInactivos = false;
    this.applyFilter();
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

      const condicionCliente = (cliente.condicionIva ?? cliente.condicion_iva ?? '')
        .toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

      const matchesCondicion =
        this.condicionIvaFiltro === 'todos'
          ? true
          : condicionCliente === this.condicionIvaFiltro;

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(cliente.activo ?? true);

      return matchesSearch && matchesCondicion && matchesActivo;
    })
      .sort((a, b) => this.compararTexto(a.nombre, b.nombre));
  }

  onMostrarInactivosChange() {
    this.applyFilter();
  }

  onCondicionIvaChange() {
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
}
