import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'secondary',
        callback: () => this.exportarPdf()
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
        next: (clientes) => { this.generarPdfCombinado(clientes, []); this.generandoPdf = false; },
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
        next: (proveedores) => { this.generarPdfCombinado([], proveedores); this.generandoPdf = false; },
        error: () => { this.generandoPdf = false; }
      });
    }
  }

  private exportarPdf(): void {
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
        this.generarPdfCombinado(clientes, proveedores);
        this.generandoPdf = false;
      },
      error: () => { this.generandoPdf = false; }
    });
  }

  private buildPivot(movimientos: CuentaCorrienteMovimiento[]): {
    fechas: string[];
    filas: Array<{ obra: string; porFecha: Record<string, number>; saldo: number }>;
  } {
    const obraMap = new Map<string, Record<string, number>>();
    const fechaSet = new Set<string>();

    for (const mov of movimientos) {
      const obra = mov.obraNombre || 'Sin obra';
      const fecha = (mov.fecha || '').substring(0, 10);
      if (!obraMap.has(obra)) obraMap.set(obra, {});
      const entry = obraMap.get(obra)!;
      entry[fecha] = (entry[fecha] || 0) + mov.monto;
      if (fecha) fechaSet.add(fecha);
    }

    const fechas = Array.from(fechaSet).sort();
    const filas = Array.from(obraMap.entries()).map(([obra, porFecha]) => ({
      obra,
      porFecha,
      saldo: Object.values(porFecha).reduce((a, b) => a + b, 0)
    }));

    return { fechas, filas };
  }

  private generarPdfCombinado(
    clientes: CuentaCorrienteClienteResponse[],
    proveedores: CuentaCorrienteProveedorResponse[]
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const fechaExport = new Date().toLocaleDateString('es-AR');
    const hoy = new Date().toISOString().split('T')[0];
    const fmt = (n: number) => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    const obraIds: number[] = this.currentFilters['obraIds'] || [];
    const esUnicoCliente = clientes.length === 1 && proveedores.length === 0;
    const esUnicoProveedor = proveedores.length === 1 && clientes.length === 0;
    const nombreEntidad = esUnicoCliente
      ? (clientes[0].clienteNombre || '')
      : esUnicoProveedor
        ? (proveedores[0].proveedorNombre || '')
        : '';
    const tipoEntidad = esUnicoCliente ? 'Cliente' : esUnicoProveedor ? 'Proveedor' : '';

    // Encabezado principal
    let y = 14;
    if (esUnicoCliente || esUnicoProveedor) {
      // Destinatario único: nombre prominente
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('CUENTA CORRIENTE', 14, y);
      y += 6;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(nombreEntidad, 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`${tipoEntidad}   |   Exportado: ${fechaExport}`, 14, y);
      y += 5;
    } else {
      // Múltiples entidades
      const hayClientes = clientes.length > 0;
      const hayProveedores = proveedores.length > 0;
      const tipoTitulo = hayClientes && !hayProveedores ? 'Clientes'
        : !hayClientes && hayProveedores ? 'Proveedores' : 'Combinada';
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Cuentas Corrientes — ${tipoTitulo}`, 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Exportado: ${fechaExport}`, 14, y);
      y += 5;
    }

    if (obraIds.length) {
      const nombres = obraIds.map(id => this.obras.find(o => o.id === id)?.nombre).filter(Boolean).join(', ');
      if (nombres) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`Obra(s): ${nombres}`, 14, y);
        y += 5;
      }
    }

    doc.setTextColor(0, 0, 0);
    y += 2;

    // Indica si se debe mostrar el sub-encabezado por entidad en addSection
    const mostrarSubtitulo = !esUnicoCliente && !esUnicoProveedor;

    const addSection = (
      titulo: string,
      nombre: string,
      movimientos: CuentaCorrienteMovimiento[],
      headerColor: [number, number, number],
      totalLabel: string,
      totalValue: number,
      saldoFinal: number,
      presupuestoMap: Map<string, number>
    ) => {
      if (y > 170) { doc.addPage(); y = 15; }

      if (mostrarSubtitulo) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${titulo}: ${nombre}`, 14, y);
        y += 4;
      }

      const { fechas, filas } = this.buildPivot(movimientos);

      if (!filas.length) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Sin movimientos.', 18, y + 3);
        y += 10;
        return;
      }

      const head = [['Obra', 'Presupuesto', ...fechas.map(f => this.formatFechaShort(f)), 'Saldo']];
      const body: string[][] = filas.map(fila => [
        fila.obra,
        fmt(presupuestoMap.get(fila.obra) ?? 0),
        ...fechas.map(f => fila.porFecha[f] != null ? fmt(fila.porFecha[f]) : '—'),
        fmt(fila.saldo)
      ]);

      // Fila totales
      const totalPresupuesto = filas.reduce((acc, fila) => acc + (presupuestoMap.get(fila.obra) ?? 0), 0);
      body.push([
        'TOTAL',
        fmt(totalPresupuesto),
        ...fechas.map(f => {
          const sum = filas.reduce((acc, fila) => acc + (fila.porFecha[f] || 0), 0);
          return sum ? fmt(sum) : '—';
        }),
        fmt(saldoFinal)
      ]);

      autoTable(doc, {
        startY: y,
        head,
        body,
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineWidth: 0.15,
          lineColor: [200, 200, 200]
        },
        headStyles: {
          fillColor: headerColor,
          fontSize: 7,
          lineWidth: 0.15,
          lineColor: [180, 180, 180]
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 45 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [235, 235, 235];
          }
        }
      });

      y = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalLabel}: ${fmt(totalValue)}   |   Saldo final: ${fmt(saldoFinal)}`, 14, y);
      y += 8;
    };

    const obraIdsFiltro: number[] = this.currentFilters['obraIds'] || [];

    // Sección clientes
    const clientesConMov = clientes.filter(c => c.movimientos?.length);
    if (clientesConMov.length) {
      if (mostrarSubtitulo) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Cuentas Corrientes — Clientes', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
      }

      for (const c of clientesConMov) {
        // obraNombre → presupuesto de esa obra para este cliente
        const presupuestoMap = new Map<string, number>();
        this.datos!.detalleDeudaClientes
          .filter(d => d.clienteId === c.clienteId)
          .filter(d => !obraIdsFiltro.length || obraIdsFiltro.includes(d.obraId))
          .forEach(d => presupuestoMap.set(d.obraNombre, d.presupuesto));

        addSection(
          'Cliente', c.clienteNombre || `ID ${c.clienteId}`,
          c.movimientos, [59, 130, 246],
          'Total cobrado', c.totalCobros, c.saldoFinal,
          presupuestoMap
        );
      }
    }

    // Sección proveedores
    const proveedoresConMov = proveedores.filter(p => p.movimientos?.length);
    if (proveedoresConMov.length) {
      if (y > 160) { doc.addPage(); y = 15; }
      if (mostrarSubtitulo) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('Cuentas Corrientes — Proveedores', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
      }

      for (const p of proveedoresConMov) {
        // obraNombre → presupuestado de este proveedor en esa obra
        const presupuestoMap = new Map<string, number>();
        this.datos!.detalleDeudaProveedores
          .filter(d => d.proveedorId === p.proveedorId)
          .filter(d => !obraIdsFiltro.length || obraIdsFiltro.includes(d.obraId))
          .forEach(d => presupuestoMap.set(d.obraNombre, d.presupuestado));

        addSection(
          'Proveedor', p.proveedorNombre || `ID ${p.proveedorId}`,
          p.movimientos, [239, 68, 68],
          'Total costos', p.totalCostos, p.saldoFinal,
          presupuestoMap
        );
      }
    }

    const fileLabel = esUnicoCliente ? 'clientes'
      : esUnicoProveedor ? 'proveedores'
      : (clientes.length > 0 && proveedores.length > 0) ? 'combinada'
      : clientes.length > 0 ? 'clientes' : 'proveedores';
    doc.save(`cuentas-corrientes-${fileLabel}-${hoy}.pdf`);
  }

  private formatFechaShort(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y.substring(2)}`;
  }
}
