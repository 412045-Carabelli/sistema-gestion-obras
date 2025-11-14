import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {DropdownModule} from 'primeng/dropdown';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {forkJoin} from 'rxjs';
import {ButtonModule} from 'primeng/button';

import {Cliente, EstadoObra, Obra} from '../../../core/models/models';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {Select} from 'primeng/select';
import {ExportService} from '../../../services/export/export.service';

interface EstadoOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-obra-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    DatePipe,
    Select
  ],
  templateUrl: './obras-list.component.html',
  styleUrls: ['./obras-list.component.css']
})
export class ObrasListComponent implements OnInit {
  @Output() obraClick = new EventEmitter<Obra>();

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  datosCargados = false;
  clientes: Cliente[] = [];
  estados: EstadoObra[] = [];

  estadoFiltro: string = 'todos';
  searchValue: string = '';
  estadosOptions: EstadoOption[] = [];

  constructor(
    private router: Router,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private estadoObraService: EstadoObraService,
    private exportService: ExportService
  ) {
  }

  ngOnInit() {
    // Carga todo en paralelo
    forkJoin({
      obras: this.obrasService.getObras(),
      clientes: this.clientesService.getClientes(),
      estados: this.estadoObraService.getEstados()
    }).subscribe(({obras, clientes, estados}) => {
      this.obras = obras

      this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      this.estados = estados.map(e => ({...e, id: Number(e.id)}));

      this.obrasFiltradas = [...this.obras];

      this.estadosOptions = [
        {label: 'Todos', value: 'todos'},
        ...this.estados.map(e => ({
          label: e.nombre.charAt(0).toUpperCase() + e.nombre.slice(1).replace('_', ' '),
          value: e.nombre.toLowerCase()
        }))
      ];

      this.datosCargados = true;
    });
  }

  // 🔍 Filtrado
  applyFilter() {
    this.obrasFiltradas = this.obras.filter(obra => {

      const matchesSearch = this.searchValue
        ? obra.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (obra.direccion?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        obra.cliente.nombre.toLowerCase().includes(this.searchValue.toLowerCase())
        : true;

      const matchesEstado =
        this.estadoFiltro === 'todos'
          ? true
          : obra.obra_estado.nombre.toLowerCase() === this.estadoFiltro.toLowerCase();

      return matchesSearch && matchesEstado;
    });
  }

  onEstadoChange() {
    this.applyFilter();
  }

  onRowClick(obra: Obra) {
    this.obraClick.emit(obra);
    this.router.navigate(['/obras', obra.id]);
  }

  exportarListado() {
    this.exportService.exportObrasExcel(this.obrasFiltradas);
  }

  // Helpers
  getClienteNombre(id_cliente: number): string {
    return this.clientes.find(c => Number(c.id) === Number(id_cliente))?.nombre ?? '—';
  }

  getEstadoSeverity(id_estado: number): string {
    const severities: { [key: number]: string } = {
      1: 'secondary',
      2: 'info',
      3: 'success',
      4: 'success',
      5: 'warning',
      6: 'contrast',
      7: 'danger'
    };
    return severities[id_estado] || 'secondary';
  }

  getProgreso(obra: Obra): number {
    if (!obra.presupuesto || obra.presupuesto === 0) return 0;
    return Math.round(((obra.gastado ?? 0) / obra.presupuesto) * 100);
  }
}
