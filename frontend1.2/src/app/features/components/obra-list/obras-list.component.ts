import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
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
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

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
    InputTextModule,
    DropdownModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    DatePipe,
    Select,
    ButtonModule,
    EstadoFormatPipe
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
  estados: { label: string; name: string }[] = [];

  estadoFiltro: string = 'TODOS';
  searchValue: string = '';
  estadosOptions: EstadoOption[] = [];
  activoFiltro: string = 'todos';
  activoOptions = [
    {label: 'Todos', value: 'todos'},
    {label: 'Activos', value: 'true'},
    {label: 'Inactivos', value: 'false'},
  ];
  private estadoInicialDesdeRuta: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private estadoObraService: EstadoObraService
  ) {
  }

  ngOnInit() {
    // Leer filtro de estado desde query params
    this.route.queryParams.subscribe(params => {
      this.estadoInicialDesdeRuta = params['estado'] ?? null;
      if (this.datosCargados) {
        this.estadoFiltro = this.estadoInicialDesdeRuta || 'TODOS';
        this.applyFilter();
      }
    });

    // Carga todo en paralelo
    forkJoin({
      obras: this.obrasService.getObras(),
      clientes: this.clientesService.getClientes(),
      estados: this.estadoObraService.getEstados()
    }).subscribe(({obras, clientes, estados}) => {
      this.obras = obras;

      this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      this.estados = estados as any;

      this.obrasFiltradas = [...this.obras];

      this.estadosOptions = [
        { label: 'Todos', value: 'TODOS'},
        ...this.estados.map(r => ({ label: r.label || r.name, value: r.name }))
      ];

      // Aplicar filtro inicial si vino por query param
      if (this.estadoInicialDesdeRuta) {
        this.estadoFiltro = this.estadoInicialDesdeRuta;
      }

      this.applyFilter();
      this.datosCargados = true;
    });
  }

  // Filtrado
  applyFilter() {
    this.obrasFiltradas = this.obras.filter(obra => {

      const matchesSearch = this.searchValue
        ? obra.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (obra.direccion?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        obra.cliente.nombre.toLowerCase().includes(this.searchValue.toLowerCase())
        : true;

      const estadoValor = this.estadoValorObra(obra);
      const matchesEstado =
        this.estadoFiltro === 'TODOS'
          ? true
          : (estadoValor || '').toUpperCase() === (this.estadoFiltro || '').toUpperCase();

      const matchesActivo =
        this.activoFiltro === 'todos'
          ? true
          : String(obra.activo ?? true) === this.activoFiltro;

      return matchesSearch && matchesEstado && matchesActivo;
    });
  }

  private estadoValorObra(obra: any): string {
    const raw = (obra as any)?.obra_estado;
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
    const raw = (obra as any)?.obra_estado;
    if (!raw) return '';
    if (typeof raw === 'string') {
      const rec = this.estados.find(r => ((r.name || '') as string).toUpperCase() === raw.toUpperCase());
      return rec?.label || rec?.name || raw;
    }
    return raw.label || raw.nombre || '';
  }

  onEstadoChange() {
    this.applyFilter();
  }

  onActivoChange() {
    this.applyFilter();
  }

  onRowClick(obra: Obra) {
    this.obraClick.emit(obra);
    this.router.navigate(['/obras', obra.id]);
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

  getActivoSeverity(activo?: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getProgreso(obra: Obra): number {
    if (!obra.presupuesto || obra.presupuesto === 0) return 0;
    return Math.round(((obra.gastado ?? 0) / obra.presupuesto) * 100);
  }
}
