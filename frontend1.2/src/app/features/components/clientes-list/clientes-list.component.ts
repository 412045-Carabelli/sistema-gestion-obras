import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {DropdownModule} from 'primeng/dropdown';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {forkJoin} from 'rxjs';

import {Cliente, CONDICION_IVA_LABELS, CondicionIva} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {Select} from 'primeng/select';

interface ActivoOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-clientes-list',
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
    Select
  ],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css']
})
export class ClientesListComponent implements OnInit {
  @Input() clientes: Cliente[] = [];
  @Output() clienteClick = new EventEmitter<Cliente>();

  clientesFiltrados: Cliente[] = [];

  searchValue: string = '';
  activoFiltro: string = 'todos';
  activoOptions: ActivoOption[] = [];
  readonly condicionIvaLabels = CONDICION_IVA_LABELS;

  constructor(
    private router: Router,
    private clientesService: ClientesService
  ) {
  }

  ngOnInit() {
    forkJoin({
      clientes: this.clientesService.getClientes()
    }).subscribe(({clientes}) => {
      this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      this.clientesFiltrados = [...this.clientes];

      this.activoOptions = [
        {label: 'Todos', value: 'todos'},
        {label: 'Activos', value: 'true'},
        {label: 'Inactivos', value: 'false'}
      ];
    });
  }

  // 🔍 Filtrado por búsqueda y activo
  applyFilter() {
    this.clientesFiltrados = this.clientes.filter(cliente => {
      const matchesSearch = this.searchValue
        ? cliente.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (cliente.contacto?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.cuit?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.telefono?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        (cliente.email?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        this.getCondicionIvaLabel(cliente.condicionIva).toLowerCase().includes(this.searchValue.toLowerCase())
        : true;

      const matchesActivo =
        this.activoFiltro === 'todos'
          ? true
          : String(cliente.activo) === this.activoFiltro;

      return matchesSearch && matchesActivo;
    });
  }

  onActivoChange() {
    this.applyFilter();
  }

  onRowClick(cliente: Cliente) {
    this.clienteClick.emit(cliente);
    this.router.navigate(['/clientes', cliente.id]);
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getCondicionIvaLabel(value?: string | CondicionIva): string {
    if (!value) return 'No informado';
    return this.condicionIvaLabels[value as CondicionIva] ?? 'No informado';
  }
}
