import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../../environments/environment';
import { ReportFilter, DeudasGlobalesResponse, CatalogoCuentaCorriente, DetalleDeudaCliente, DetalleDeudaProveedor, CuentaCorrienteClienteResponse, CuentaCorrienteProveedorResponse, CuentaCorrienteMovimiento } from '../../../core/models/models';
import { ConfiguracionService, CONFIG_KEYS } from '../../../services/configuracion/configuracion.service';
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
  private logoDataUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private reportesService: ReportesService,
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.setupFilterActions();
    this.cargarCatalogos();
    this.precargarLogo();
  }

  private precargarLogo(): void {
    this.subs.add(
      this.configService.config$.subscribe(config => {
        const url = config[CONFIG_KEYS.LOGO_URL] || '/buildr-icono.svg';
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 160;
          canvas.height = img.naturalHeight || 160;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          try {
            this.logoDataUrl = canvas.toDataURL('image/png');
          } catch {
            this.logoDataUrl = null;
          }
        };
        img.onerror = () => { this.logoDataUrl = null; };
        img.src = url;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setupFilterActions(): void {
    this.filterActions = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'danger',
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
        this.generarPdfCombinado(clientes, proveedores);
        this.generandoPdf = false;
      },
      error: () => { this.generandoPdf = false; }
    });
  }

  private generarPdfCombinado(
    clientes: CuentaCorrienteClienteResponse[],
    proveedores: CuentaCorrienteProveedorResponse[]
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ml = 20;
    const mr = 20;
    const hoyStr = new Date().toISOString().split('T')[0];
    const empresaNombre = this.configService.get(CONFIG_KEYS.EMPRESA_NOMBRE, 'Sistema de Gestión');

    const fmt = (n: number) =>
      `$ ${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtFecha = (s: string) => {
      if (!s) return '-';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s.substring(0, 10) : d.toLocaleDateString('es-AR');
    };

    const logoSize = 14;
    const logoY = 8;

    const drawHeader = (title: string) => {
      if (this.logoDataUrl) {
        doc.addImage(this.logoDataUrl, 'PNG', ml, logoY, logoSize, logoSize);
      }
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(empresaNombre.toUpperCase(), pageW / 2, 18, { align: 'center' });
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(ml, 24, pageW - mr, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(title, pageW / 2, 34, { align: 'center' });
      doc.line(ml, 40, pageW - mr, 40);
      doc.setTextColor(0, 0, 0);
    };

    const drawFooter = (finalY: number) => {
      const footerY = Math.min(finalY + 10, pageH - 12);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(ml, footerY - 3, pageW - mr, footerY - 3);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Nota: Ante cualquier consulta sobre su cuenta, comuníquese con nuestro departamento de administración.',
        ml, footerY + 3, { maxWidth: pageW - ml - mr }
      );
      doc.setTextColor(0, 0, 0);
    };

    let isFirst = true;

    // ── CLIENTES ──────────────────────────────────────────────────────────
    for (const c of clientes) {
      if (!isFirst) doc.addPage();
      isFirst = false;

      drawHeader('Detalle de cuenta corriente');

      let y = 48;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cliente: ${c.clienteNombre || ''}`, ml, y);
      y += 7;

      const obrasCliente = (this.datos?.detalleDeudaClientes || [])
        .filter(d => d.clienteId === c.clienteId);

      if (obrasCliente.length === 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Obra: ${obrasCliente[0].obraNombre}`, ml, y);
        y += 7;
      }
      y += 4;

      const presupuestoTotal = obrasCliente.reduce((s, d) => s + (d.presupuesto || 0), 0);

      // Calcular desde movimientos si backend devuelve 0
      const allMovsC = c.movimientos || [];
      const calcTotalCobros = allMovsC.reduce((sum, mov) => {
        const esCredito = (mov.tipo || '').toUpperCase().includes('COBRO');
        return sum + (esCredito ? (mov.monto || 0) : 0);
      }, 0);
      const ultimoMovC = allMovsC[allMovsC.length - 1];
      const saldoFinalC = ultimoMovC?.saldoCliente ?? (c.saldoFinal || 0);
      const totalCobrosC = c.totalCobros || calcTotalCobros;

      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        head: [['RESUMEN DEL PRESUPUESTO', '']],
        body: [
          ['Monto del Presupuesto:', fmt(presupuestoTotal)],
          ['Total Abonado:', fmt(totalCobrosC)]
        ],
        styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
        headStyles: { fillColor: [230, 230, 230], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { fontStyle: 'bold', halign: 'right' } },
        theme: 'plain'
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(230, 230, 230);
      doc.rect(ml, y, pageW - ml - mr, 7, 'F');
      doc.text('DETALLE DE MOVIMIENTOS', ml + 3, y + 5);
      y += 9;

      const movRowsC = (c.movimientos || []).map(mov => {
        const esCredito = (mov.tipo || '').toUpperCase().includes('COBRO');
        const esDebito = !esCredito && !!(mov.tipo);
        const saldo = mov.saldoCliente ?? 0;
        return [
          fmtFecha(mov.fecha),
          mov.concepto || mov.referencia || mov.tipo || '-',
          esDebito ? fmt(mov.monto) : '-',
          esCredito ? fmt(mov.monto) : '-',
          fmt(saldo)
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        head: [['FECHA', 'DESCRIPCIÓN', 'DÉBITO', 'CRÉDITO', 'SALDO']],
        body: movRowsC.length ? movRowsC : [['', 'Sin movimientos', '', '', '']],
        styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
        headStyles: {
          fillColor: [255, 255, 255], textColor: [80, 80, 80],
          fontStyle: 'bold', lineWidth: { bottom: 0.3 }, lineColor: [180, 180, 180]
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 33, halign: 'right', fontStyle: 'bold' }
        },
        theme: 'plain',
        alternateRowStyles: { fillColor: [248, 248, 248] }
      });

      y = (doc as any).lastAutoTable.finalY + 6;

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(ml, y, pageW - mr, y);
      y += 7;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Saldo:', pageW - mr - 55, y);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(saldoFinalC), pageW - mr, y, { align: 'right' });

      drawFooter(y + 4);
    }

    // ── PROVEEDORES ───────────────────────────────────────────────────────
    for (const p of proveedores) {
      if (!isFirst) doc.addPage();
      isFirst = false;

      drawHeader('DETALLE DE CUENTA CORRIENTE — PROVEEDOR');

      let y = 48;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Proveedor: ${p.proveedorNombre || ''}`, ml, y);
      y += 12;

      // Calcular totales desde movimientos (backend puede devolver 0 en los agregados)
      const allMovsProv = p.movimientos || [];
      const calcTotalCostos = allMovsProv.reduce((sum, mov) => {
        const tipoUp = (mov.tipo || '').toUpperCase();
        const esD = tipoUp.includes('COSTO') || tipoUp.includes('TRABAJO') || tipoUp.includes('MANO');
        return sum + (esD ? (mov.monto || 0) : 0);
      }, 0);
      const calcTotalPagos = allMovsProv.reduce((sum, mov) => {
        const tipoUp = (mov.tipo || '').toUpperCase();
        const esC = tipoUp.includes('PAGO') || tipoUp.includes('RETENCION');
        return sum + (esC ? (mov.monto || 0) : 0);
      }, 0);
      const ultimoMovProv = allMovsProv[allMovsProv.length - 1];
      const saldoActualProv = ultimoMovProv?.saldoProveedor ?? (calcTotalCostos - calcTotalPagos);

      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        head: [['RESUMEN GENERAL', '']],
        body: [
          ['Total Costos:', fmt(calcTotalCostos)],
          ['Pagos Realizados:', fmt(calcTotalPagos)],
          [
            { content: 'Saldo Actual:', styles: { fontStyle: 'bold' } },
            { content: fmt(saldoActualProv), styles: { fontStyle: 'bold', halign: 'right' } }
          ]
        ],
        styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
        headStyles: { fillColor: [230, 230, 230], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } },
        theme: 'plain'
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(230, 230, 230);
      doc.rect(ml, y, pageW - ml - mr, 7, 'F');
      doc.text('DETALLE DE OBRAS', ml + 3, y + 5);
      y += 10;

      const obraGroups = new Map<string, CuentaCorrienteMovimiento[]>();
      for (const mov of (p.movimientos || [])) {
        const key = mov.obraNombre || 'Sin obra';
        if (!obraGroups.has(key)) obraGroups.set(key, []);
        obraGroups.get(key)!.push(mov);
      }

      for (const [obraNombre, movs] of obraGroups) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Obra: ${obraNombre}`, ml, y);
        y += 5;

        const movRowsP = movs.map(mov => {
          const tipoUp = (mov.tipo || '').toUpperCase();
          const esDebito = tipoUp.includes('COSTO') || tipoUp.includes('TRABAJO') || tipoUp.includes('MANO');
          const esCredito = tipoUp.includes('PAGO') || tipoUp.includes('RETENCION');
          const saldo = mov.saldoProveedor ?? 0;
          return [
            fmtFecha(mov.fecha),
            mov.concepto || mov.referencia || mov.tipo || '-',
            esDebito ? fmt(mov.monto) : '-',
            esCredito ? fmt(mov.monto) : '-',
            fmt(saldo)
          ];
        });

        autoTable(doc, {
          startY: y,
          margin: { left: ml, right: mr },
          head: [['FECHA', 'DESCRIPCIÓN', 'DÉBITO', 'CRÉDITO', 'SALDO']],
          body: movRowsP.length ? movRowsP : [['', '-', '', '', '']],
          styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
          headStyles: {
            fillColor: [255, 255, 255], textColor: [80, 80, 80],
            fontStyle: 'bold', lineWidth: { bottom: 0.3 }, lineColor: [180, 180, 180]
          },
          columnStyles: {
            0: { cellWidth: 26 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 33, halign: 'right', fontStyle: 'bold' }
          },
          theme: 'plain',
          alternateRowStyles: { fillColor: [248, 248, 248] }
        });

        y = (doc as any).lastAutoTable.finalY + 8;
      }

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(ml, y, pageW - mr, y);
      y += 7;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Saldo:', pageW - mr - 55, y);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(saldoActualProv), pageW - mr, y, { align: 'right' });

      drawFooter(y + 4);
    }

    const esUnicoCliente = clientes.length === 1 && proveedores.length === 0;
    const esUnicoProveedor = proveedores.length === 1 && clientes.length === 0;
    const fileLabel = esUnicoCliente
      ? (clientes[0].clienteNombre || 'cliente')
      : esUnicoProveedor
      ? (proveedores[0].proveedorNombre || 'proveedor')
      : (clientes.length > 0 && proveedores.length > 0) ? 'combinado'
      : clientes.length > 0 ? 'clientes' : 'proveedores';

    doc.save(`cuentas-corrientes-${fileLabel}-${hoyStr}.pdf`);
  }
}
