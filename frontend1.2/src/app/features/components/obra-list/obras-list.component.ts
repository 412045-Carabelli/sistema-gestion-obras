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
import {catchError, forkJoin, of} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {MultiSelectModule} from 'primeng/multiselect';

import {Cliente, EstadoObra, Factura, Obra} from '../../../core/models/models';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {FacturasService} from '../../../services/facturas/facturas.service';
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
    CheckboxModule,
    MultiSelectModule,
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

  estadoFiltro: string[] = [];
  searchValue: string = '';
  mostrarInactivos = false;
  estadosOptions: EstadoOption[] = [];
  private estadoInicialDesdeRuta: string[] = [];
  private facturasPorObra: Record<number, Factura[]> = {};
  private readonly ESTADOS_CON_FACTURACION = ['ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private estadoObraService: EstadoObraService,
    private facturasService: FacturasService
  ) {
  }

  ngOnInit() {
    // Leer filtro de estado desde query params
    this.route.queryParams.subscribe(params => {
      this.estadoInicialDesdeRuta = this.parseEstadoFiltro(params['estado'] ?? null);
      if (this.datosCargados) {
        this.estadoFiltro = [...this.estadoInicialDesdeRuta];
        this.applyFilter();
      }
    });

    // Carga todo en paralelo
    forkJoin({
      obras: this.obrasService.getObrasAll(),
      clientes: this.clientesService.getClientes(),
      estados: this.estadoObraService.getEstados(),
      facturas: this.facturasService.getFacturas().pipe(catchError(() => of([])))
    }).subscribe(({obras, clientes, estados, facturas}) => {
      this.obras = obras;

      this.facturasPorObra = (facturas as Factura[]).reduce((acc, f) => {
        if (f.id_obra) {
          if (!acc[f.id_obra]) acc[f.id_obra] = [];
          acc[f.id_obra].push(f);
        }
        return acc;
      }, {} as Record<number, Factura[]>);

      this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
      this.estados = this.ordenarEstadosObra(estados as any);

      this.obrasFiltradas = [...this.obras];

      this.estadosOptions = this.estados.map(r => ({ label: r.label || r.name, value: r.name }));

      // Aplicar filtro inicial si vino por query param
      if (this.estadoInicialDesdeRuta) {
        this.estadoFiltro = [...this.estadoInicialDesdeRuta];
      }

      this.applyFilter();
      this.datosCargados = true;
    });
  }

  // Filtrado
  applyFilter() {
    this.obrasFiltradas = this.obras
      .filter(obra => {

      const matchesSearch = this.searchValue
        ? obra.nombre.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (obra.direccion?.toLowerCase().includes(this.searchValue.toLowerCase()) ?? false) ||
        obra.cliente.nombre.toLowerCase().includes(this.searchValue.toLowerCase())
        : true;

      const estadoValor = this.estadoValorObra(obra);
      const matchesEstado =
        this.estadoFiltro.length === 0
          ? true
          : this.estadoFiltro.some(estado => (estadoValor || '').toUpperCase() === (estado || '').toUpperCase());

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(obra.activo ?? true);

      return matchesSearch && matchesEstado && matchesActivo;
    })
      .sort((a, b) => {
        const creadaA = a.creado_en ? new Date(a.creado_en).getTime() : 0;
        const creadaB = b.creado_en ? new Date(b.creado_en).getTime() : 0;
        if (creadaA !== creadaB) return creadaB - creadaA;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
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

  getEstadoFacturacion(obra: Obra): {label: string; severity: string} | undefined {
    const estado = this.estadoValorObra(obra).toUpperCase();
    if (!this.ESTADOS_CON_FACTURACION.includes(estado)) return undefined;

    const facturas = (this.facturasPorObra[obra.id!] ?? []).filter(f => f.activo !== false);
    if (facturas.length === 0) {
      return {label: 'Pendiente', severity: 'warn'};
    }
    const totalFacturado = facturas.reduce((sum, f) => sum + (f.monto ?? 0), 0);
    const presupuesto = obra.presupuesto ?? 0;
    if (presupuesto > 0 && totalFacturado >= presupuesto) {
      return {label: 'Total', severity: 'success'};
    }
    return {label: 'Parcial', severity: 'info'};
  }

  getNumeroOrden(obra: Obra): number {
    return Number(obra.id ?? 0);
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

  private ordenarEstadosObra(records: { label: string; name: string }[]): { label: string; name: string }[] {
    const ordenDeseado = [
      'PRESUPUESTADA',
      'COTIZADA',
      'PERDIDA',
      'ADJUDICADA',
      'EN_PROGRESO',
      'FINALIZADA',
      'FACTURADA_PARCIAL',
      'FACTURADA',
      'COBRADA'
    ];
    const index = new Map(ordenDeseado.map((estado, i) => [estado, i]));
    const normalizar = (value?: string | null) =>
      (value || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

    return [...(records || [])].sort((a, b) => {
      const aKey = index.get(normalizar(a?.name || a?.label)) ?? 999;
      const bKey = index.get(normalizar(b?.name || b?.label)) ?? 999;
      if (aKey !== bKey) return aKey - bKey;
      return (a?.label || '').localeCompare(b?.label || '');
    });
  }

  onEstadoChange() {
    this.applyFilter();
  }

  private parseEstadoFiltro(raw: string | string[] | null): string[] {
    if (!raw) return [];
    const values = Array.isArray(raw) ? raw : raw.split(',');
    return values
      .map(value => (value || '').toString().trim().toUpperCase())
      .filter(Boolean);
  }

  onMostrarInactivosChange() {
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

  getProgreso(obra: Obra): number {
    if (!obra.presupuesto || obra.presupuesto === 0) return 0;
    return Math.round(((obra.gastado ?? 0) / obra.presupuesto) * 100);
  }
}
