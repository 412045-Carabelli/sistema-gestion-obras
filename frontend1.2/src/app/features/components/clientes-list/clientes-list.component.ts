import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
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
import {GenericTableComponent, GenericColumn} from '../../../shared/generic-table/generic-table.component';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    CheckboxModule,
    Select,
    GenericTableComponent
  ],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css']
})
export class ClientesListComponent implements OnInit {
  @Input() clientes: Cliente[] = [];
  @Output() clienteClick = new EventEmitter<Cliente>();

  @ViewChild('saldoCell', {static: true}) saldoCell!: TemplateRef<any>;

  clientesFiltrados: Cliente[] = [];
  datosCargados = false;
  ivaOptions: { label: string; name: string }[] = [];

  searchValue: string = '';
  condicionIvaFiltro: string | 'todos' = 'todos';
  mostrarInactivos = false;
  columns: GenericColumn<Cliente>[] = [];
  customTemplates: Record<string, TemplateRef<any>> = {};

  constructor(
    private router: Router,
    private clientesService: ClientesService
  ) {
  }

  ngOnInit() {
    this.columns = [
      {key: 'nombre', header: 'Nombre', field: 'nombre'},
      {key: 'contacto', header: 'Contacto', field: 'contacto'},
      {key: 'direccion', header: 'Direccion', field: 'direccion'},
      {key: 'cuit', header: 'DNI/CUIT', field: 'cuit'},
      {key: 'telefono', header: 'Telefono', field: 'telefono'},
      {key: 'email', header: 'Email', field: 'email'},
      {key: 'saldo', header: 'Saldo', type: 'custom', align: 'right'}
    ];
    this.customTemplates = {
      saldo: this.saldoCell
    };

    forkJoin({
      clientes: this.clientesService.getClientes(),
      condicionesIva: this.clientesService.getCondicionesIva()
    }).subscribe({
      next: ({clientes, condicionesIva}) => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
        this.ivaOptions = [
          {label: 'Todas', name: 'todos'},
          ...condicionesIva
        ];

        this.applyFilter();
        this.datosCargados = true;
      },
      error: () => {
        this.datosCargados = true;
      }
    });
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
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
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

  clienteRowClass(): string {
    return 'hover:bg-gray-100 transition-colors';
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
}
