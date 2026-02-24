import {Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {forkJoin, Observable} from 'rxjs';
import {CheckboxModule} from 'primeng/checkbox';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';

import {Cliente, Factura, Obra, Transaccion} from '../../../core/models/models';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {GenericTableComponent, GenericColumn} from '../../../shared/generic-table/generic-table.component';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

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
    GenericTableComponent,
    EstadoFormatPipe
  ],
  templateUrl: './facturas-list.component.html',
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit {
  @Output() facturaClick = new EventEmitter<Factura>();

  @ViewChild('facturasBody', {static: true}) facturasBody!: TemplateRef<any>;

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
  cobrosPorObra: Record<number, number> = {};
  facturadoPorObra: Record<number, number> = {};
  presupuestoPorObra: Record<number, number> = {};
  private obrasById = new Map<number, Obra>();

  searchValue: string = '';
  clienteFiltro: number | 'todos' = 'todos';
  obraFiltro: number | 'todos' = 'todos';
  mostrarInactivos = false;
  clientesOptions: SelectOption<number | 'todos'>[] = [];
  obrasOptions: SelectOption<number | 'todos'>[] = [];
  datosCargados = false;
  private expandedObras = new Set<number>();

  columns: GenericColumn<any>[] = [];

  constructor(
    private router: Router,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService
  ) {
  }

  ngOnInit() {
    this.columns = [
      {key: 'cliente', header: 'Cliente'},
      {key: 'obra', header: 'Obra'},
      {key: 'estado', header: 'Estado'},
      {key: 'presupuesto', header: 'Presupuesto', align: 'right'},
      {key: 'facturado', header: 'Facturado', align: 'right'},
      {key: 'porFacturar', header: 'Por facturar', align: 'right'}
    ];

    forkJoin({
      facturas: this.facturasService.getFacturas(),
      clientes: this.clientesService.getClientes(),
      obras: this.obrasService.getObrasAll()
    }).subscribe({
      next: ({facturas, clientes, obras}) => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
        this.obras = obras;

        const clientesIndex = new Map<number, string>(
          this.clientes.map(c => [Number(c.id), c.nombre])
        );
        const obrasIndex = new Map<number, string>(
          this.obras.filter(o => o.id !== undefined).map(o => [Number(o.id), o.nombre])
        );

        this.facturadoPorObra = (facturas || []).reduce((acc, f) => {
          const key = Number(f.id_obra || 0);
          acc[key] = (acc[key] ?? 0) + Number(f.monto || 0);
          return acc;
        }, {} as Record<number, number>);

        this.presupuestoPorObra = this.obras.reduce((acc, o) => {
          const key = Number(o.id || 0);
          acc[key] = this.calcularPresupuestoObra(o);
          return acc;
        }, {} as Record<number, number>);

        this.obrasById = new Map<number, Obra>(
          this.obras.filter(o => o.id !== undefined).map(o => [Number(o.id), o])
        );

        this.facturas = (facturas || []).map(f => {
          const obraId = f.id_obra != null ? Number(f.id_obra) : null;
          const presupuesto = obraId != null ? (this.presupuestoPorObra[obraId] ?? 0) : 0;
          const facturado = obraId != null ? (this.facturadoPorObra[obraId] ?? 0) : 0;
          const porFacturar = obraId != null && this.obraEsFacturable(obraId)
            ? Math.max(0, presupuesto - facturado)
            : undefined;
          const porCobrar = this.obtenerPorCobrarFactura(f);
          return {
            ...f,
            clienteNombre: clientesIndex.get(Number(f.id_cliente)) || 'Sin cliente',
            obraNombre: obraId != null
              ? (obrasIndex.get(obraId) || `Obra #${obraId}`)
              : 'Sin obra',
            porCobrarObra: porCobrar,
            porFacturarObra: porFacturar,
            descripcionTexto: this.stripHtml(f.descripcion)
          };
        });

        this.clientesOptions = [
          {label: 'Todos', value: 'todos'},
          ...this.clientes.map(c => ({label: c.nombre, value: Number(c.id)}))
        ];
        this.updateObrasOptions();

        this.applyFilter();
        this.construirListadoObras();
        this.cargarCobrosPorObra();
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

      const matchesActivo = this.mostrarInactivos
        ? true
        : Boolean(factura.activo ?? true);

      return matchesSearch && matchesCliente && matchesObra && matchesActivo;
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
            : Number(this.obrasById.get(obra.id)?.cliente?.id) === Number(this.clienteFiltro);
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
        : this.obras.filter(o => Number(o.cliente?.id) === Number(this.clienteFiltro));

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

  toggleObraRow(obraId: number) {
    const id = Number(obraId);
    if (!id) return;
    if (this.expandedObras.has(id)) {
      this.expandedObras.delete(id);
    } else {
      this.expandedObras.add(id);
    }
  }

  isObraExpanded(obraId: number): boolean {
    return this.expandedObras.has(Number(obraId));
  }


  get totalPresupuesto(): number {
    return this.obrasScopeRequiereFactura.reduce((sum, o) => sum + this.calcularPresupuestoObra(o), 0);
  }

  get totalFacturado(): number {
    return this.facturasScopeRequiereFactura.reduce((sum, f) => sum + Number(f.monto || 0), 0);
  }

  get totalPorFacturar(): number {
    return this.obrasScopeRequiereFactura.reduce((sum, obra) => {
      const obraId = Number(obra.id ?? 0);
      const facturado = this.facturadoPorObra[obraId] ?? 0;
      const presupuesto = this.presupuestoPorObra[obraId] ?? this.calcularPresupuestoObra(obra);
      return sum + Math.max(0, Number(presupuesto || 0) - facturado);
    }, 0);
  }

  get totalCobrado(): number {
    return this.obrasScopeRequiereFactura.reduce((sum, obra) => {
      const obraId = Number(obra.id ?? 0);
      const facturado = this.facturadoPorObra[obraId] ?? 0;
      if (facturado <= 0) return sum;
      return sum + (this.cobrosPorObra[obraId] ?? 0);
    }, 0);
  }

  get totalPorCobrar(): number {
    return this.facturasScopeRequiereFactura.reduce((sum, factura) => {
      return sum + this.obtenerPorCobrarFactura(factura);
    }, 0);
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

  private get facturasScopeRequiereFactura(): FacturaView[] {
    return this.facturasScope.filter(f => this.obraRequiereFactura(f.id_obra) && this.obraEsFacturable(f.id_obra));
  }

  private get obrasScopeRequiereFactura(): Obra[] {
    return this.obrasScope.filter(o => !!o.requiere_factura && this.obraEsFacturable(o.id));
  }

  private get obrasScope(): Obra[] {
    if (this.obraFiltro !== 'todos') {
      return this.obras.filter(o => Number(o.id) === Number(this.obraFiltro));
    }
    if (this.clienteFiltro !== 'todos') {
      return this.obras.filter(o => Number(o.cliente?.id) === Number(this.clienteFiltro));
    }
    return this.obras;
  }

  private obraRequiereFactura(idObra?: number | null): boolean {
    const id = Number(idObra ?? 0);
    if (!id) return false;
    return !!this.obrasById.get(id)?.requiere_factura;
  }

  private obraEsFacturable(idObra?: number | null): boolean {
    const id = Number(idObra ?? 0);
    if (!id) return false;
    const obra = this.obrasById.get(id);
    if (!obra) return false;
    const estado = this.normalizarEstado(obra.obra_estado);
    return ['ADJUDICADA', 'EN_PROGRESO', 'FINALIZADA', 'FACTURADA', 'COBRADA'].includes(estado);
  }

  private cargarCobrosPorObra() {
    const obraIds = this.obras
      .map(o => Number(o.id || 0))
      .filter(id => id > 0);
    if (obraIds.length === 0) {
      this.cobrosPorObra = {};
      this.datosCargados = true;
      return;
    }

    const requests: Record<number, Observable<Transaccion[]>> = {};
    obraIds.forEach(id => {
      requests[id] = this.transaccionesService.getByObra(id);
    });

    forkJoin(requests).subscribe({
      next: (result) => {
        const cobros: Record<number, number> = {};
        Object.keys(result).forEach(key => {
          const id = Number(key);
          const movimientos = result[id] || [];
          cobros[id] = movimientos
            .filter(m => this.esCobro(m))
            .reduce((sum, m) => sum + Number(m.monto || 0), 0);
        });
        this.cobrosPorObra = cobros;
        this.facturas = this.facturas.map(f => ({
          ...f,
          porCobrarObra: this.obtenerPorCobrarFactura(f)
        }));
        this.construirListadoObras();
        this.applyFilter();
        this.datosCargados = true;
      },
      error: () => {
        this.datosCargados = true;
      }
    });
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
      impacta_cta_cte: !!factura.impacta_cta_cte
    };

    this.facturasService.updateFactura(Number(factura.id), payload).subscribe({
      next: (updated) => {
        this.facturas = this.facturas.map(f => {
          if (Number(f.id) !== Number(factura.id)) return f;
          const porCobrar = this.obtenerPorCobrarFactura({
            ...f,
            ...updated
          });
          return {
            ...f,
            ...updated,
            porCobrarObra: porCobrar
          };
        });
        this.applyFilter();
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

  private esCobro(mov: Transaccion): boolean {
    const raw: any = (mov as any).tipo_transaccion ?? (mov as any).tipo_movimiento ?? (mov as any).tipo;
    if (typeof raw === 'string') return raw.toUpperCase().includes('COBRO');
    if (raw && typeof raw.id === 'number') return raw.id === 1;
    const nombre = (raw?.nombre || '').toString().toUpperCase();
    return nombre.includes('COBRO');
  }

  private calcularPresupuestoObra(obra: Obra): number {
    if (!obra) return 0;
    const costos = obra.costos ?? [];
    if (!costos.length) {
      return Number(obra.presupuesto ?? 0);
    }

    const beneficioGlobal = obra.beneficio_global ? Number(obra.beneficio ?? 0) : null;
    const subtotalCostos = costos.reduce((acc, c) => {
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + base;
    }, 0);

    const beneficioCostos = costos.reduce((acc, c) => {
      const esAdicional = (c.tipo_costo || '').toString().toUpperCase() === 'ADICIONAL';
      const porc = esAdicional
        ? Number(c.beneficio ?? 0)
        : (beneficioGlobal !== null ? beneficioGlobal : Number(c.beneficio ?? 0));
      const base = Number(
        c.subtotal ??
        (Number(c.cantidad ?? 0) * Number(c.precio_unitario ?? 0))
      );
      return acc + (base * (porc / 100));
    }, 0);

    const totalConBeneficio = subtotalCostos + beneficioCostos;
    const comisionPorc = obra.tiene_comision ? Number(obra.comision ?? 0) : 0;
    return totalConBeneficio * (1 + (comisionPorc / 100));
  }

  private construirListadoObras() {
    const facturasPorObra = new Map<number, FacturaView[]>();
    this.facturas.forEach(f => {
      const obraId = Number(f.id_obra ?? 0);
      if (!obraId) return;
      if (!facturasPorObra.has(obraId)) facturasPorObra.set(obraId, []);
      facturasPorObra.get(obraId)!.push(f);
    });

    const obrasFacturables = this.obras
      .filter(o => o.id != null)
      .filter(o => this.obraRequiereFactura(o.id))
      .filter(o => this.obraEsFacturable(o.id));

    this.obrasFacturacion = obrasFacturables.map(o => {
      const obraId = Number(o.id);
      const presupuesto = this.presupuestoPorObra[obraId] ?? this.calcularPresupuestoObra(o);
      const facturado = this.facturadoPorObra[obraId] ?? 0;
      const porFacturar = Math.max(0, presupuesto - facturado);
      return {
        id: obraId,
        nombre: o.nombre || `Obra #${obraId}`,
        clienteNombre: o.cliente?.nombre || 'Sin cliente',
        estado: this.normalizarEstado(o.obra_estado),
        presupuesto,
        facturado,
        porFacturar,
        facturas: (facturasPorObra.get(obraId) || []).sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
      };
    });
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
