import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { environment } from '../../../../environments/environment';
import { ReportFilter, DeudasGlobalesResponse, CatalogoCuentaCorriente, DetalleDeudaCliente, DetalleDeudaProveedor, CuentaCorrienteClienteResponse, CuentaCorrienteProveedorResponse, CuentaCorrienteMovimiento } from '../../../core/models/models';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, forkJoin, of } from 'rxjs';
import { GenericFilterBarComponent, FilterDefinition, FilterAction } from '../generic-filter-bar/generic-filter-bar.component';
import { KpiCardComponent } from '../../../shared/kpi-card/kpi-card.component';
import { ReportesService } from '../../../services/reportes/reportes.service';

@Component({
  selector: 'app-cuentas-corrientes-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    CardModule,
    TooltipModule,
    GenericFilterBarComponent,
    KpiCardComponent
  ],
  templateUrl: './cuentas-corrientes-list.component.html',
  styleUrls: ['./cuentas-corrientes-list.component.css']
})
export class CuentasCorrientesListComponent implements OnInit, OnDestroy {
  loading = false;
  generandoPdf = false;
  datosCargados = false;
  datos: DeudasGlobalesResponse | null = null;
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];
  currentFilters: Record<string, any> = {};
  grupos: Array<{ id: number; nombre: string }> = [];
  obras: Array<{ id: number; nombre: string }> = [];
  clientes: Array<{ id: number; nombre: string }> = [];
  proveedores: Array<{ id: number; nombre: string }> = [];

  @Output() clienteRowClicked = new EventEmitter<DetalleDeudaCliente>();
  @Output() proveedorRowClicked = new EventEmitter<DetalleDeudaProveedor>();

  private subs = new Subscription();
  private catalogoUrl = `${environment.apiGateway}/bff/reportes/catalogos/filtros-cuenta-corriente`;
  private deudasUrl = `${environment.apiGateway}/bff/reportes/financieros/deudas-globales`;
  private pdfUrl = `${environment.apiGateway}/bff/reportes/financieros/cuentas-corrientes-combinadas-pdf`;

  constructor(private http: HttpClient, private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.setupFilterActions();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setupFilterActions(): void {
    this.filterActions = [
      {
        label: 'Exportar Excel',
        icon: 'pi pi-file-excel',
        severity: 'secondary',
        callback: () => this.exportarExcel()
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.cargar();
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.cargar();
  }

  private cargarCatalogos(): void {
    this.subs.add(
      this.http.get<CatalogoCuentaCorriente>(this.catalogoUrl).subscribe({
        next: (response) => {
          this.grupos = response.grupos || [];
          this.obras = response.obras || [];
          this.clientes = response.clientes || [];
          this.proveedores = response.proveedores || [];
          this.setupFilterDefinitions();
          this.cargar();
        },
        error: (err) => {
          console.error('Error al cargar catálogos', err);
          this.setupFilterDefinitions();
          this.cargar();
        }
      })
    );
  }

  private setupFilterDefinitions(): void {
    this.filterDefinitions = [
      {
        key: 'clienteId',
        label: 'Cliente',
        type: 'select',
        placeholder: 'Todos',
        options: this.clientes.map((c) => ({ label: c.nombre, value: c.id }))
      },
      {
        key: 'proveedorId',
        label: 'Proveedor',
        type: 'select',
        placeholder: 'Todos',
        options: this.proveedores.map((p) => ({ label: p.nombre, value: p.id }))
      },
      {
        key: 'obraIds',
        label: 'Obra(s)',
        type: 'multiselect',
        placeholder: 'Todas',
        options: this.obras.map((o) => ({ label: o.nombre, value: o.id }))
      }
    ];
  }

  private cargar(): void {
    this.loading = true;
    const obraIds: number[] = this.currentFilters['obraIds'] || [];
    const filtro: ReportFilter = {
      grupoId: this.currentFilters['grupoId'],
      obraIds: obraIds.length ? obraIds : undefined,
      clienteId: this.currentFilters['clienteId'],
      proveedorId: this.currentFilters['proveedorId']
    };

    this.subs.add(
      this.http.post<DeudasGlobalesResponse>(this.deudasUrl, filtro).subscribe({
        next: (response) => {
          this.datos = response;
          this.loading = false;
          this.datosCargados = true;
        },
        error: (err) => {
          console.error('Error al cargar cuentas corrientes', err);
          this.loading = false;
          this.datosCargados = true;
        }
      })
    );
  }

  getRangeClientes(): number[] {
    if (!this.datos?.detalleDeudaClientes) return [];
    return Array.from({ length: this.datos.detalleDeudaClientes.length }, (_, i) => i);
  }

  getRangeProveedores(): number[] {
    if (!this.datos?.detalleDeudaProveedores) return [];
    return Array.from({ length: this.datos.detalleDeudaProveedores.length }, (_, i) => i);
  }

  onClienteRowClick(item: DetalleDeudaCliente): void {
    this.clienteRowClicked.emit(item);
  }

  onProveedorRowClick(item: DetalleDeudaProveedor): void {
    this.proveedorRowClicked.emit(item);
  }

  exportarPdfSolo(tipo: 'clientes' | 'proveedores'): void {
    if (!this.datos) return;
    this.generandoPdf = true;

    const obraIds: number[] = this.currentFilters['obraIds'] || [];
    const filtroObraIds = obraIds.length ? obraIds : undefined;
    const clienteIdFiltro = this.currentFilters['clienteId'];
    const proveedorIdFiltro = this.currentFilters['proveedorId'];

    if (tipo === 'clientes') {
      const clienteIds = [...new Set(
        this.datos.detalleDeudaClientes
          .filter(d => d.clienteId && (!clienteIdFiltro || d.clienteId === clienteIdFiltro))
          .map(d => d.clienteId!)
      )];
      const reqs = clienteIds.map(id =>
        this.reportesService.getCuentaCorrienteCliente({ clienteId: id, obraIds: filtroObraIds })
      );
      (reqs.length ? forkJoin(reqs) : of([] as CuentaCorrienteClienteResponse[])).subscribe({
        next: (clientes) => { this.generarExcelCombinado(clientes, []); this.generandoPdf = false; },
        error: () => { this.generandoPdf = false; }
      });
    } else {
      const proveedorIds = [...new Set(
        this.datos.detalleDeudaProveedores
          .filter(d => !proveedorIdFiltro || d.proveedorId === proveedorIdFiltro)
          .map(d => d.proveedorId)
      )];
      const reqs = proveedorIds.map(id =>
        this.reportesService.getCuentaCorrienteProveedor({ proveedorId: id, obraIds: filtroObraIds })
      );
      (reqs.length ? forkJoin(reqs) : of([] as CuentaCorrienteProveedorResponse[])).subscribe({
        next: (proveedores) => { this.generarExcelCombinado([], proveedores); this.generandoPdf = false; },
        error: () => { this.generandoPdf = false; }
      });
    }
  }

  private exportarExcel(): void {
    if (!this.datos) return;
    this.generandoPdf = true;

    const obraIds: number[] = this.currentFilters['obraIds'] || [];
    const filtroObraIds = obraIds.length ? obraIds : undefined;
    const clienteIdFiltro = this.currentFilters['clienteId'];
    const proveedorIdFiltro = this.currentFilters['proveedorId'];

    const clienteIds = [...new Set(
      this.datos.detalleDeudaClientes
        .filter(d => d.clienteId && (!clienteIdFiltro || d.clienteId === clienteIdFiltro))
        .map(d => d.clienteId!)
    )];
    const proveedorIds = [...new Set(
      this.datos.detalleDeudaProveedores
        .filter(d => !proveedorIdFiltro || d.proveedorId === proveedorIdFiltro)
        .map(d => d.proveedorId)
    )];

    const clienteReqs = clienteIds.map(id =>
      this.reportesService.getCuentaCorrienteCliente({ clienteId: id, obraIds: filtroObraIds })
    );
    const proveedorReqs = proveedorIds.map(id =>
      this.reportesService.getCuentaCorrienteProveedor({ proveedorId: id, obraIds: filtroObraIds })
    );

    forkJoin({
      clientes: clienteReqs.length ? forkJoin(clienteReqs) : of([] as CuentaCorrienteClienteResponse[]),
      proveedores: proveedorReqs.length ? forkJoin(proveedorReqs) : of([] as CuentaCorrienteProveedorResponse[])
    }).subscribe({
      next: ({ clientes, proveedores }) => {
        this.generarExcelCombinado(clientes, proveedores);
        this.generandoPdf = false;
      },
      error: () => { this.generandoPdf = false; }
    });
  }

  private generarExcelCombinado(
    clientes: CuentaCorrienteClienteResponse[],
    proveedores: CuentaCorrienteProveedorResponse[]
  ): void {
    const hoy = new Date().toISOString().split('T')[0];
    const obraIdsFiltro: number[] = this.currentFilters['obraIds'] || [];
    const wb = XLSX.utils.book_new();

    const buildPivotSheet = (
      nombre: string,
      movimientos: CuentaCorrienteMovimiento[],
      presupuestoMap: Map<string, number>,
      totalLabel: string,
      totalValue: number,
      saldoFinal: number
    ) => {
      // Recopilar todas las fechas únicas ordenadas
      const fechaSet = new Set<string>();
      for (const mov of movimientos) {
        const f = (mov.fecha || '').substring(0, 10);
        if (f) fechaSet.add(f);
      }
      const fechas = Array.from(fechaSet).sort();

      // Pivot: obra → { fecha → sumatoria }
      const obraMap = new Map<string, Record<string, number>>();
      for (const [obraNombre] of presupuestoMap) {
        obraMap.set(obraNombre, {});
      }
      for (const mov of movimientos) {
        const key = mov.obraNombre || 'Sin obra';
        if (!obraMap.has(key)) obraMap.set(key, {});
        const f = (mov.fecha || '').substring(0, 10);
        const entry = obraMap.get(key)!;
        entry[f] = (entry[f] || 0) + mov.monto;
      }

      const header = ['Obra', 'Presupuesto', ...fechas, 'Saldo'];
      const rows: any[][] = [];

      for (const [obraNombre, porFecha] of obraMap) {
        const presupuesto = presupuestoMap.get(obraNombre) ?? 0;
        const totalObra = Object.values(porFecha).reduce((a, b) => a + b, 0);
        const saldo = presupuesto - totalObra;
        rows.push([
          obraNombre,
          presupuesto,
          ...fechas.map(f => porFecha[f] ?? 0),
          saldo
        ]);
      }

      // Fila totales
      const totalPres = Array.from(presupuestoMap.values()).reduce((a, b) => a + b, 0);
      rows.push([
        'TOTAL',
        totalPres,
        ...fechas.map(f => {
          let sum = 0;
          for (const porFecha of obraMap.values()) sum += porFecha[f] ?? 0;
          return sum;
        }),
        saldoFinal
      ]);

      const wsData = [header, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Formato monetario: separador de miles, 2 decimales, "-" para cero
      const moneyFmt = '#,##0.00;-#,##0.00;"-"';
      const numRows = wsData.length;
      // Columnas monetarias: presupuesto (1), fechas (2..2+N-1), saldo (2+N)
      const moneyCols = [1, ...fechas.map((_, i) => 2 + i), 2 + fechas.length];
      for (let r = 1; r < numRows; r++) {
        for (const c of moneyCols) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (ws[addr] && typeof ws[addr].v === 'number') {
            ws[addr].z = moneyFmt;
          }
        }
      }

      // Ancho de columnas
      ws['!cols'] = [
        { wch: 40 },  // Obra
        { wch: 18 },  // Presupuesto
        ...fechas.map(() => ({ wch: 14 })),
        { wch: 18 }   // Saldo
      ];

      // Nombre de hoja: truncar a 31 chars (límite Excel)
      const sheetName = nombre.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    for (const c of clientes) {
      const presupuestoMap = new Map<string, number>();
      this.datos!.detalleDeudaClientes
        .filter(d => d.clienteId === c.clienteId)
        .filter(d => !obraIdsFiltro.length || obraIdsFiltro.includes(d.obraId))
        .forEach(d => presupuestoMap.set(d.obraNombre, d.presupuesto));

      buildPivotSheet(
        c.clienteNombre || `Cliente ${c.clienteId}`,
        c.movimientos ?? [],
        presupuestoMap,
        'Total cobrado', c.totalCobros, c.saldoFinal
      );
    }

    for (const p of proveedores) {
      const presupuestoMap = new Map<string, number>();
      this.datos!.detalleDeudaProveedores
        .filter(d => d.proveedorId === p.proveedorId)
        .filter(d => !obraIdsFiltro.length || obraIdsFiltro.includes(d.obraId))
        .forEach(d => presupuestoMap.set(d.obraNombre, d.presupuestado));

      buildPivotSheet(
        p.proveedorNombre || `Proveedor ${p.proveedorId}`,
        p.movimientos ?? [],
        presupuestoMap,
        'Total pagado', p.totalPagos, p.saldoFinal
      );
    }

    const esUnicoCliente = clientes.length === 1 && proveedores.length === 0;
    const esUnicoProveedor = proveedores.length === 1 && clientes.length === 0;
    const fileLabel = esUnicoCliente ? (clientes[0].clienteNombre || 'clientes')
      : esUnicoProveedor ? (proveedores[0].proveedorNombre || 'proveedores')
      : (clientes.length > 0 && proveedores.length > 0) ? 'combinada'
      : clientes.length > 0 ? 'clientes' : 'proveedores';

    XLSX.writeFile(wb, `cuentas-corrientes-${fileLabel}-${hoy}.xlsx`);
  }
}
