import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {forkJoin, Observable} from 'rxjs';

import {Cliente, Factura, Obra, Transaccion} from '../../../core/models/models';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';

interface FacturaView extends Factura {
  clienteNombre?: string;
  obraNombre?: string;
  porCobrarObra?: number;
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
    Select,
    ProgressSpinnerModule,
    TooltipModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './facturas-list.component.html',
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit {
  @Output() facturaClick = new EventEmitter<Factura>();

  facturas: FacturaView[] = [];
  facturasFiltradas: FacturaView[] = [];
  clientes: Cliente[] = [];
  obras: Obra[] = [];
  cobrosPorObra: Record<number, number> = {};

  searchValue: string = '';
  clienteFiltro: number | 'todos' = 'todos';
  obraFiltro: number | 'todos' = 'todos';
  clientesOptions: SelectOption<number | 'todos'>[] = [];
  obrasOptions: SelectOption<number | 'todos'>[] = [];
  datosCargados = false;

  constructor(
    private router: Router,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService
  ) {
  }

  ngOnInit() {
    forkJoin({
      facturas: this.facturasService.getFacturas(),
      clientes: this.clientesService.getClientes(),
      obras: this.obrasService.getObras()
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

        const facturadoPorObra = (facturas || []).reduce((acc, f) => {
          const key = Number(f.id_obra || 0);
          acc[key] = (acc[key] ?? 0) + Number(f.monto || 0);
          return acc;
        }, {} as Record<number, number>);

        const presupuestoPorObra = this.obras.reduce((acc, o) => {
          const key = Number(o.id || 0);
          acc[key] = Number(o.presupuesto || 0);
          return acc;
        }, {} as Record<number, number>);

        this.facturas = (facturas || []).map(f => {
          const obraId = Number(f.id_obra || 0);
          const presupuesto = presupuestoPorObra[obraId] ?? 0;
          const facturado = facturadoPorObra[obraId] ?? 0;
          const porCobrar = Math.max(0, presupuesto - facturado);
          return {
            ...f,
            clienteNombre: clientesIndex.get(Number(f.id_cliente)) || 'Sin cliente',
            obraNombre: obrasIndex.get(Number(f.id_obra)) || `Obra #${f.id_obra}`,
            porCobrarObra: porCobrar
          };
        });

        this.clientesOptions = [
          {label: 'Todos', value: 'todos'},
          ...this.clientes.map(c => ({label: c.nombre, value: Number(c.id)}))
        ];
        this.updateObrasOptions();

        this.facturasFiltradas = [...this.facturas];
        this.cargarCobrosPorObra();
      },
      error: () => {
        this.datosCargados = true;
      }
    });
  }

  applyFilter() {
    this.facturasFiltradas = this.facturas.filter(factura => {
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

      return matchesSearch && matchesCliente && matchesObra;
    });
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

  downloadFactura(event: Event, factura: FacturaView) {
    event.stopPropagation();
    if (!factura.id) {
      return;
    }
    this.facturasService.downloadFactura(factura.id).subscribe(blob => {
      const fileName = factura.nombre_archivo || `factura_${factura.id}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
  }

  get totalPresupuesto(): number {
    return this.obrasScope.reduce((sum, o) => sum + Number(o.presupuesto || 0), 0);
  }

  get totalFacturado(): number {
    return this.facturasScope.reduce((sum, f) => sum + Number(f.monto || 0), 0);
  }

  get totalCobrado(): number {
    if (this.obraFiltro !== 'todos') {
      return this.cobrosPorObra[Number(this.obraFiltro)] ?? 0;
    }
    if (this.clienteFiltro !== 'todos') {
      const obrasCliente = this.obras.filter(o => Number(o.cliente?.id) === Number(this.clienteFiltro));
      return obrasCliente.reduce((sum, o) => sum + (this.cobrosPorObra[Number(o.id)] ?? 0), 0);
    }
    return Object.values(this.cobrosPorObra).reduce((sum, v) => sum + Number(v || 0), 0);
  }

  get totalPorCobrar(): number {
    return Math.max(0, this.totalPresupuesto - this.totalCobrado);
  }

  get saldoFinal(): number {
    return this.totalCobrado - this.totalPresupuesto;
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
      return this.obras.filter(o => Number(o.cliente?.id) === Number(this.clienteFiltro));
    }
    return this.obras;
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
        this.datosCargados = true;
      },
      error: () => {
        this.datosCargados = true;
      }
    });
  }

  private esCobro(mov: Transaccion): boolean {
    const raw: any = (mov as any).tipo_transaccion ?? (mov as any).tipo_movimiento ?? (mov as any).tipo;
    if (typeof raw === 'string') return raw.toUpperCase().includes('COBRO');
    if (raw && typeof raw.id === 'number') return raw.id === 1;
    const nombre = (raw?.nombre || '').toString().toUpperCase();
    return nombre.includes('COBRO');
  }
}
