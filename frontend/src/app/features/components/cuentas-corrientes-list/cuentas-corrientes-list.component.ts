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
import { Subscription, forkJoin, of, BehaviorSubject, switchMap, tap } from 'rxjs';
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

  private filtros$ = new BehaviorSubject<Record<string, any>>({});

  @Output() clienteRowClicked = new EventEmitter<DetalleDeudaCliente>();
  @Output() proveedorRowClicked = new EventEmitter<DetalleDeudaProveedor>();

  private subs = new Subscription();
  private catalogoUrl = `${environment.apiGateway}/bff/reportes/catalogos/filtros-cuenta-corriente`;
  private filtrosUrl = `${environment.apiGateway}/bff/reportes/filtros`;
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
    this.filtros$.next(filters);
    this.actualizarOpcionesConSwitchMap(filters);
    this.cargar();
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.filtros$.next({});
    this.setupFilterDefinitions();
    this.cargar();
  }

  private actualizarOpcionesConSwitchMap(filters: Record<string, any>): void {
    const proveedorId = filters['proveedorId'];
    const clienteId = filters['clienteId'];
    const obraIds = filters['obraIds'];

    if (proveedorId) {
      this.subs.add(
        this.http.get<Array<{id: number; nombre: string}>>(
          `${this.filtrosUrl}/obras-por-proveedor?proveedorId=${proveedorId}`
        ).subscribe(obras => {
          this.actualizarOpcionesEnFilterBar('obraIds', obras);
        })
      );

      this.subs.add(
        this.http.get<Array<{id: number; nombre: string}>>(
          `${this.filtrosUrl}/clientes-por-proveedor?proveedorId=${proveedorId}`
        ).subscribe(cls => {
          this.actualizarOpcionesEnFilterBar('clienteId', cls);
        })
      );
    }

    if (clienteId) {
      this.subs.add(
        this.http.get<Array<{id: number; nombre: string}>>(
          `${this.filtrosUrl}/obras-por-cliente?clienteId=${clienteId}`
        ).subscribe(obras => {
          this.actualizarOpcionesEnFilterBar('obraIds', obras);
        })
      );
    }

    if (obraIds && Array.isArray(obraIds) && obraIds.length > 0) {
      const firstObraId = obraIds[0];
      this.subs.add(
        this.http.get<Array<{id: number; nombre: string}>>(
          `${this.filtrosUrl}/proveedores-por-obra?obraId=${firstObraId}`
        ).subscribe(provs => {
          this.actualizarOpcionesEnFilterBar('proveedorId', provs);
        })
      );
    }
  }

  private actualizarOpcionesEnFilterBar(key: string, opciones: Array<{id: number; nombre: string}>): void {
    const idx = this.filterDefinitions.findIndex(f => f.key === key);
    if (idx >= 0) {
      this.filterDefinitions[idx].options = opciones.map(o => ({
        label: o.nombre,
        value: o.id
      }));
    }
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
    const hoyIso = new Date().toISOString().split('T')[0];
    const hoyDisplay = new Date().toLocaleDateString('es-AR');
    const empresaNombre = this.configService.get(CONFIG_KEYS.EMPRESA_NOMBRE, 'Sistema de Gestión');

    const fmt = (n: number) =>
      `$ ${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtFecha = (s: string) => {
      if (!s) return '-';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s.substring(0, 10) : d.toLocaleDateString('es-AR');
    };

    // ── Helpers de dibujo ────────────────────────────────────────────────

    const drawPageHeader = (title: string) => {
      if (this.logoDataUrl) {
        doc.addImage(this.logoDataUrl, 'PNG', ml, 8, 14, 14);
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

    // Encabezado de sección principal (fondo gris oscuro)
    const drawSectionHeader = (label: string, y: number): number => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(210, 210, 210);
      doc.rect(ml, y, pageW - ml - mr, 7, 'F');
      doc.setTextColor(30, 30, 30);
      doc.text(label, ml + 3, y + 5);
      doc.setTextColor(0, 0, 0);
      return y + 9;
    };

    // Encabezado de sub-sección (fondo gris claro)
    const drawSubSectionHeader = (label: string, y: number): number => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(238, 238, 238);
      doc.rect(ml, y, pageW - ml - mr, 6, 'F');
      doc.setTextColor(50, 50, 50);
      doc.text(label, ml + 3, y + 4.5);
      doc.setTextColor(0, 0, 0);
      return y + 7;
    };

    const drawSeparator = (y: number): number => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(ml, y, pageW - mr, y);
      return y + 5;
    };

    const drawFooter = () => {
      const footerY = pageH - 12;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(ml, footerY - 3, pageW - mr, footerY - 3);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Emitido el ${hoyDisplay}  ·  Ante cualquier consulta comuníquese con el departamento de administración.`,
        pageW / 2, footerY + 2, { align: 'center', maxWidth: pageW - ml - mr }
      );
      doc.setTextColor(0, 0, 0);
    };

    // ── Clasificación de movimientos de proveedor ────────────────────────
    // Desde la óptica del PROVEEDOR:
    //   CRÉDITO = costo/trabajo/material/servicio que la empresa asume (aumenta deuda)
    //   DÉBITO  = pago/retención que reduce la deuda
    const getCostCategory = (tipo: string): string | null => {
      const t = tipo.toUpperCase();
      if (t.includes('MANO') || t.includes('TRABAJO')) return 'Total Mano de Obra';
      if (t.includes('MATERIAL')) return 'Total Materiales';
      if (t.includes('SERVICIO')) return 'Total Servicios';
      if (t.includes('COSTO')) return 'Total Costos';
      return null;
    };

    const esPago = (tipo: string): boolean => {
      const t = tipo.toUpperCase();
      return t.includes('PAGO') || t.includes('RETENCION');
    };

    let isFirst = true;

    // ── PROVEEDORES ───────────────────────────────────────────────────────
    for (const p of proveedores) {
      if (!isFirst) doc.addPage();
      isFirst = false;

      drawPageHeader('Detalle de Cuenta Corriente – Proveedor');

      let y = 48;

      // Encabezado de entidad
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proveedor: ${p.proveedorNombre || ''}`, ml, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha: ${hoyDisplay}`, pageW - mr, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 12;

      // ── RESUMEN GENERAL ──────────────────────────────────────────────
      y = drawSectionHeader('RESUMEN GENERAL', y);

      const allMovsProv = p.movimientos || [];
      let totalCreditos = 0;
      let totalDebitos = 0;
      for (const mov of allMovsProv) {
        if (getCostCategory(mov.tipo || '')) totalCreditos += mov.monto || 0;
        else if (esPago(mov.tipo || '')) totalDebitos += mov.monto || 0;
      }
      const saldoTotalProv = totalCreditos - totalDebitos;

      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        body: [
          ['Total Costos (Créditos):', fmt(totalCreditos)],
          ['Pagos Realizados (Débitos):', fmt(totalDebitos)],
          [
            { content: 'Saldo Actual:', styles: { fontStyle: 'bold' } },
            { content: fmt(saldoTotalProv), styles: { fontStyle: 'bold', halign: 'right' } }
          ]
        ],
        styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
        columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right' } },
        theme: 'plain'
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // ── DETALLE DE OBRAS ─────────────────────────────────────────────
      y = drawSectionHeader('DETALLE DE OBRAS', y);

      // Agrupar movimientos por obra
      const obraGroupsProv = new Map<string, { obraId: number; movimientos: CuentaCorrienteMovimiento[] }>();
      for (const mov of allMovsProv) {
        const key = mov.obraNombre || 'Sin obra';
        if (!obraGroupsProv.has(key)) {
          obraGroupsProv.set(key, { obraId: mov.obraId ?? 0, movimientos: [] });
        }
        obraGroupsProv.get(key)!.movimientos.push(mov);
      }

      let obraIdx = 0;
      for (const [obraNombre, grupo] of obraGroupsProv) {
        if (obraIdx > 0) {
          y = drawSeparator(y);
        }

        // Buscar cliente de esta obra en los datos globales
        const clienteDeObra = (this.datos?.detalleDeudaClientes || [])
          .find(d => d.obraId === grupo.obraId)?.clienteNombre || '-';

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Obra: ${obraNombre}`, ml, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Cliente: ${clienteDeObra}`, ml + 95, y);
        doc.setTextColor(0, 0, 0);
        y += 7;

        // Colapsar costos por categoría (CRÉDITO); pagos individuales (DÉBITO)
        const categoryTotals = new Map<string, number>();
        const pagoRows: Array<{ fecha: string; concepto: string; monto: number }> = [];
        let obraCreditos = 0;
        let obraDebitos = 0;

        for (const mov of grupo.movimientos) {
          const cat = getCostCategory(mov.tipo || '');
          if (cat) {
            categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + (mov.monto || 0));
            obraCreditos += mov.monto || 0;
          } else if (esPago(mov.tipo || '')) {
            pagoRows.push({
              fecha: fmtFecha(mov.fecha),
              concepto: mov.concepto || mov.referencia || mov.tipo || '-',
              monto: mov.monto || 0
            });
            obraDebitos += mov.monto || 0;
          }
        }

        const tableRows: any[] = [];
        for (const [cat, total] of categoryTotals) {
          tableRows.push(['-', cat, fmt(total), '-']);
        }
        for (const pago of pagoRows) {
          tableRows.push([pago.fecha, pago.concepto, '-', fmt(pago.monto)]);
        }

        autoTable(doc, {
          startY: y,
          margin: { left: ml, right: mr },
          head: [['FECHA', 'DESCRIPCIÓN', 'CRÉDITO', 'DÉBITO']],
          body: tableRows.length ? tableRows : [['', 'Sin movimientos', '', '']],
          styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
          headStyles: {
            fillColor: [255, 255, 255], textColor: [80, 80, 80],
            fontStyle: 'bold', lineWidth: { bottom: 0.3 }, lineColor: [180, 180, 180]
          },
          columnStyles: {
            0: { cellWidth: 26 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' }
          },
          theme: 'plain',
          alternateRowStyles: { fillColor: [248, 248, 248] }
        });
        y = (doc as any).lastAutoTable.finalY + 5;

        // ── SALDO DE ESTA OBRA ────────────────────────────────────────
        y = drawSubSectionHeader('SALDO DE ESTA OBRA', y);

        const saldoObra = obraCreditos - obraDebitos;
        autoTable(doc, {
          startY: y,
          margin: { left: ml, right: mr },
          body: [
            ['Total Costos:', fmt(obraCreditos)],
            ['Pagos:', fmt(obraDebitos)],
            [
              { content: 'Saldo:', styles: { fontStyle: 'bold' } },
              { content: fmt(saldoObra), styles: { fontStyle: 'bold', halign: 'right' } }
            ]
          ],
          styles: { fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 } },
          columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } },
          theme: 'plain'
        });
        y = (doc as any).lastAutoTable.finalY + 5;

        obraIdx++;
      }

      drawFooter();
    }

    // ── CLIENTES ──────────────────────────────────────────────────────────
    for (const c of clientes) {
      if (!isFirst) doc.addPage();
      isFirst = false;

      drawPageHeader('Detalle de Cuenta Corriente – Cliente');

      let y = 48;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cliente: ${c.clienteNombre || ''}`, ml, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha: ${hoyDisplay}`, pageW - mr, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 12;

      // ── RESUMEN GENERAL ──────────────────────────────────────────────
      y = drawSectionHeader('RESUMEN GENERAL', y);

      const allMovsC = c.movimientos || [];
      const obrasCliente = (this.datos?.detalleDeudaClientes || [])
        .filter(d => d.clienteId === c.clienteId);
      const presupuestoTotal = obrasCliente.reduce((s, d) => s + (d.presupuesto || 0), 0);

      // Desde la óptica del CLIENTE:
      //   DÉBITO  = cargo/factura que aumenta lo que el cliente nos debe
      //   CRÉDITO = cobro/pago del cliente que reduce su saldo pendiente
      let totalCobros = 0;
      for (const mov of allMovsC) {
        if ((mov.tipo || '').toUpperCase().includes('COBRO')) {
          totalCobros += mov.monto || 0;
        }
      }
      const saldoPendienteTotal = presupuestoTotal - totalCobros;

      autoTable(doc, {
        startY: y,
        margin: { left: ml, right: mr },
        body: [
          ['Presupuesto Total (Débitos):', fmt(presupuestoTotal)],
          ['Total Cobrado (Créditos):', fmt(totalCobros)],
          [
            { content: 'Saldo Pendiente:', styles: { fontStyle: 'bold' } },
            { content: fmt(saldoPendienteTotal), styles: { fontStyle: 'bold', halign: 'right' } }
          ]
        ],
        styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
        columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right' } },
        theme: 'plain'
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // ── DETALLE DE OBRAS ─────────────────────────────────────────────
      y = drawSectionHeader('DETALLE DE OBRAS', y);

      // Agrupar movimientos por obra
      const obraGroupsC = new Map<string, { obraId: number; movimientos: CuentaCorrienteMovimiento[] }>();
      for (const mov of allMovsC) {
        const key = mov.obraNombre || 'Sin obra';
        if (!obraGroupsC.has(key)) {
          obraGroupsC.set(key, { obraId: mov.obraId ?? 0, movimientos: [] });
        }
        obraGroupsC.get(key)!.movimientos.push(mov);
      }

      let obraIdxC = 0;
      for (const [obraNombre, grupo] of obraGroupsC) {
        if (obraIdxC > 0) {
          y = drawSeparator(y);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Obra: ${obraNombre}`, ml, y);
        y += 7;

        let obraDebitos = 0;
        let obraCreditos = 0;

        const movRowsC: any[] = [];
        for (const mov of grupo.movimientos) {
          const esCredito = (mov.tipo || '').toUpperCase().includes('COBRO');
          const saldo = mov.saldoCliente ?? 0;
          if (esCredito) obraCreditos += mov.monto || 0;
          else obraDebitos += mov.monto || 0;
          movRowsC.push([
            fmtFecha(mov.fecha),
            mov.concepto || mov.referencia || mov.tipo || '-',
            !esCredito ? fmt(mov.monto) : '-',
            esCredito ? fmt(mov.monto) : '-',
            fmt(saldo)
          ]);
        }

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
        y = (doc as any).lastAutoTable.finalY + 5;

        // ── SALDO DE ESTA OBRA ────────────────────────────────────────
        y = drawSubSectionHeader('SALDO DE ESTA OBRA', y);

        const obraInfo = obrasCliente.find(d => d.obraId === grupo.obraId);
        const presupuestoObra = obraInfo?.presupuesto ?? obraDebitos;
        const saldoObra = presupuestoObra - obraCreditos;

        autoTable(doc, {
          startY: y,
          margin: { left: ml, right: mr },
          body: [
            ['Presupuesto:', fmt(presupuestoObra)],
            ['Cobrado:', fmt(obraCreditos)],
            [
              { content: 'Saldo:', styles: { fontStyle: 'bold' } },
              { content: fmt(saldoObra), styles: { fontStyle: 'bold', halign: 'right' } }
            ]
          ],
          styles: { fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 } },
          columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } },
          theme: 'plain'
        });
        y = (doc as any).lastAutoTable.finalY + 5;

        obraIdxC++;
      }

      drawFooter();
    }

    const esUnicoCliente = clientes.length === 1 && proveedores.length === 0;
    const esUnicoProveedor = proveedores.length === 1 && clientes.length === 0;
    const fileLabel = esUnicoCliente
      ? (clientes[0].clienteNombre || 'cliente')
      : esUnicoProveedor
      ? (proveedores[0].proveedorNombre || 'proveedor')
      : (clientes.length > 0 && proveedores.length > 0) ? 'combinado'
      : clientes.length > 0 ? 'clientes' : 'proveedores';

    doc.save(`cuentas-corrientes-${fileLabel}-${hoyIso}.pdf`);
  }
}
