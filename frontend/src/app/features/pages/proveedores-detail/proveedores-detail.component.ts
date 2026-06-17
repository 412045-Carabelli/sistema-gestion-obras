import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {CommonModule, DatePipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {ButtonModule} from 'primeng/button';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {Obra, Proveedor, Tarea, Transaccion} from '../../../core/models/models';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {Tooltip} from 'primeng/tooltip';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {ProveedoresStateService} from '../../../services/proveedores/proveedores-state.service';
import {StyleClass} from 'primeng/styleclass';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {MenuModule} from 'primeng/menu';
import {MenuItem, MessageService, ConfirmationService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule} from '@angular/forms';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

@Component({
  selector: 'app-proveedores-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ProgressSpinnerModule,
    TableModule, TagModule, Tooltip, StyleClass, EstadoFormatPipe, ClientesDocumentosComponent,
    MenuModule, ToastModule, ConfirmDialog, CheckboxModule, FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './proveedores-detail.component.html'
})
export class ProveedoresDetailComponent implements OnInit, OnDestroy {
  proveedor!: Proveedor;
  tareas: Tarea[] = [];
  obrasMap: Record<number, Obra> = {};
  obras: Obra[] = [];
  transacciones: Transaccion[] = [];
  obrasSaldoProveedor: Array<{ id: number; nombre: string; estado: string; total: number; pagado: number; saldo: number }> = [];
  totalCostos = 0;
  totalPagos = 0;
  saldoProveedor = 0;
  loading = true;
  selectedTab = '0';

  // Estado selector de obras para exportar
  modoExportacion: 'todas' | 'algunas' | null = null;
  obrasSeleccionadas = new Set<number>();
  generandoPdf = false;
  menuExportOptions: MenuItem[] = [];
  private pdfMakeReady = false;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proveedoresService: ProveedoresService,
    private tareasService: TareasService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private proveedoresStateService: ProveedoresStateService,
    private reportesService: ReportesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient
  ) {
    this.menuExportOptions = [
      {
        label: 'Generar todas',
        icon: 'pi pi-check',
        command: () => this.seleccionarModoExportacion('todas')
      },
      {
        label: 'Generar algunas',
        icon: 'pi pi-filter',
        command: () => this.seleccionarModoExportacion('algunas')
      }
    ];
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    this.selectedTab = tabParam || '0';
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.proveedoresStateService.clearProveedor();
  }

  refrescar() {
    if (this.proveedor?.id) {
      this.cargarDetalle(this.proveedor.id);
    }
  }

  getNombreObra(idObra: number): string {
    return this.obrasMap[idObra]?.nombre ?? `Obra #${idObra}`;
  }

  getEstadoObraDisplay(obra: Obra | null | undefined): string {
    const raw = obra?.obra_estado;
    if (!raw) return '-';
    if (typeof raw === 'string') return raw;
    return (raw as any)?.nombre ?? (raw as any)?.name ?? (raw as any)?.label ?? '-';
  }

  irADetalleObra(idObra: number) {
    this.router.navigate(['/obras', idObra]);
  }

  irADetalleObraMov(idObra: number) {
    // Navega a la obra y abre la pestaña de movimientos si existe (tab index 2).
    this.router.navigate(['/obras', idObra], {queryParams: {tab: 2}});
  }
  toggleActivo() {
    const actualizado = {...this.proveedor, activo: !this.proveedor.activo};
    this.proveedoresService.updateProveedor(this.proveedor.id!, actualizado).subscribe({
      next: (prov) => {
        this.proveedor = prov;
        this.proveedoresStateService.setProveedor(prov);
      },
      error: () => {
        this.proveedoresStateService.setProveedor(this.proveedor);
      }
    });
  }

  private cargarDetalle(id: number) {
    this.loading = true;
    forkJoin({
      proveedor: this.proveedoresService.getProveedorById(id),
      tareas: this.tareasService.getTareasByProveedor(id),
      transacciones: this.transaccionesService.getByAsociado('PROVEEDOR', id),
      obras: this.obrasService.getObras(),
      saldos: this.reportesService.getSaldosProveedor(id)
    })
      .subscribe({
        next: ({proveedor, tareas, transacciones, obras, saldos}) => {
          this.proveedor = proveedor;
          this.proveedoresStateService.setProveedor(proveedor);
          this.tareas = tareas;
          this.transacciones = transacciones || [];
          this.obras = obras || [];
          this.obrasMap = (obras || []).reduce((acc, obra) => {
            acc[obra.id!] = obra;
            return acc;
          }, {} as Record<number, Obra>);
          this.totalCostos = saldos.totalCostos;
          this.totalPagos = saldos.totalPagado;
          this.saldoProveedor = saldos.saldo;
          this.obrasSaldoProveedor = saldos.obras.map(o => ({
            id: o.obraId,
            nombre: o.nombre,
            estado: o.estado,
            total: o.presupuestado,
            pagado: o.pagado || 0,
            saldo: o.saldo
          }));
          this.loading = false;
        },
        error: () => (this.loading = false)
      });
  }

  formatearTipo(tipo: string | null | undefined): string {
    if (!tipo) return '—';

    const limpio = tipo.replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }


  get totalObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }

  get totalPagadoObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.pagado || 0), 0);
  }

  get totalSaldoObrasProveedor(): number {
    return this.obrasSaldoProveedor.reduce((sum, item) => sum + Number(item.saldo || 0), 0);
  }


  // ===== EXPORTAR CUENTA CORRIENTE PDF =====

  seleccionarModoExportacion(modo: 'todas' | 'algunas') {
    this.modoExportacion = modo;
    if (modo === 'todas') {
      // Generar para todas las obras del proveedor
      this.generarCtaCte();
    }
    // Si es 'algunas', se muestra una columna de checkboxes en la tabla
  }

  toggleSeleccionObra(obraId: number) {
    if (this.obrasSeleccionadas.has(obraId)) {
      this.obrasSeleccionadas.delete(obraId);
    } else {
      this.obrasSeleccionadas.add(obraId);
    }
  }

  esObraSeleccionada(obraId: number): boolean {
    return this.obrasSeleccionadas.has(obraId);
  }

  cancelarSeleccion() {
    this.modoExportacion = null;
    this.obrasSeleccionadas.clear();
  }

  generarCtaCte(obraId?: number) {
    if (!this.proveedor?.id) return;

    if (this.generandoPdf) {
      this.messageService.add({
        severity: 'warn',
        summary: 'PDF en proceso',
        detail: 'Espera a que termine la generación actual.'
      });
      return;
    }

    // Definir obras a incluir
    let obraIds: number[] = [];
    if (obraId) {
      // Botón individual
      obraIds = [obraId];
    } else if (this.modoExportacion === 'todas') {
      // Todas las obras del proveedor
      obraIds = this.obrasSaldoProveedor.map(o => o.id);
    } else if (this.modoExportacion === 'algunas') {
      // Obras seleccionadas
      if (this.obrasSeleccionadas.size === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Selecciona al menos una obra.'
        });
        return;
      }
      obraIds = Array.from(this.obrasSeleccionadas);
    } else {
      return;
    }

    this.generandoPdf = true;
    this.ensurePdfMakeReady();

    this.reportesService.getCuentaCorrientePdfProveedor(
      this.proveedor.id!,
      obraIds.length > 0 ? obraIds : undefined
    ).subscribe({
      next: (data: any) => {
        this.generarPdfCtaCte(data);
        this.cancelarSeleccion();
      },
      error: () => {
        this.generandoPdf = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener la información de cuenta corriente.'
        });
      }
    });
  }

  private generarPdfCtaCte(data: any) {
    const datePipe = new DatePipe('es-AR');
    const hoy = datePipe.transform(new Date(), 'dd/MM/yyyy') ?? '';

    const cell = (text: any, extra: any = {}) => ({
      text: String(text ?? ''),
      fontSize: 9,
      valign: 'middle',
      ...extra
    });

    const headerCell = (text: string) => cell(text, {
      bold: true,
      fillColor: '#f3f4f6',
      alignment: 'center',
      fontSize: 9
    });

    // Construir encabezados dinámicos (fechas únicas)
    const fechas: string[] = (data.fechasUnicas || []).map((f: string) => {
      const date = new Date(f);
      return datePipe.transform(date, 'dd/MM/yyyy') ?? f;
    });

    // Encabezados: [Obra | Fecha1 | Fecha2 | ...]
    const encabezados = [headerCell('Obra'), ...fechas.map(f => headerCell(f))];

    // Filas de datos
    const filas = (data.filas || []).map((fila: any) => {
      const rowCells = [cell(fila.obraNombre || 'N/A', { alignment: 'left' })];
      for (const fecha of fechas) {
        const clave = (data.fechasUnicas || [])[fechas.indexOf(fecha)];
        const monto = fila.movimientosPorFecha?.[clave];
        const formattedMonto = monto
          ? Number(monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
          : '-';
        rowCells.push(cell(formattedMonto, { alignment: 'right' }));
      }
      return rowCells;
    });

    const formatCurrency = (value: number) =>
      Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    const widths = ['*', ...Array(fechas.length).fill(70)];

    const docDefinition: any = {
      pageMargins: [20, 40, 20, 60],
      content: [
        { text: 'CUENTA CORRIENTE', style: 'title', margin: [0, 0, 0, 4] },
        { text: `Proveedor: ${data.asociadoNombre || 'N/A'}`, fontSize: 10, margin: [0, 0, 0, 2] },
        { text: `Generado: ${hoy}`, fontSize: 8, color: '#6b7280', margin: [0, 0, 0, 16] },

        {
          table: {
            widths: widths,
            headerRows: 1,
            body: [encabezados, ...filas]
          },
          layout: {
            fillColor: (ri: number) => ri === 0 ? '#f3f4f6' : ri % 2 === 0 ? '#f9fafb' : null,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 16]
        },

        {
          alignment: 'right',
          table: {
            widths: ['*', 150],
            body: [
              [cell('SALDO FINAL', { bold: true }), cell(formatCurrency(data.saldoFinal || 0), { bold: true, alignment: 'right' })]
            ]
          },
          layout: {
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 4]
        }
      ],
      styles: {
        title: { fontSize: 14, bold: true, color: '#1e293b' }
      }
    };

    try {
      const nombreArchivo = `CtaCte_Proveedor_${data.asociadoNombre}_${hoy.replace(/\//g, '-')}.pdf`;
      pdfMake.createPdf(docDefinition).download(nombreArchivo);
      pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, nombreArchivo);
        formData.append('tipo_documento', 'OTRO');
        formData.append('id_asociado', String(data.asociadoId));
        formData.append('tipo_asociado', 'PROVEEDOR');
        formData.append('observacion', `Cuenta corriente generada el ${hoy}`);

        this.http.post(`${environment.apiGateway}/bff/documentos`, formData).subscribe({
          next: () => this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Cta. cte. guardada en documentos.'
          }),
          error: () => {} // silencioso si falla
        });
      });

      this.messageService.add({
        severity: 'success',
        summary: 'PDF generado',
        detail: 'La cuenta corriente se descargó correctamente.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el PDF.'
      });
    } finally {
      this.generandoPdf = false;
    }
  }

  private ensurePdfMakeReady() {
    if (this.pdfMakeReady) return;
    const fonts = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;
    if (fonts) {
      (pdfMake as any).vfs = fonts;
      this.pdfMakeReady = true;
    }
  }

  onTabChange(event: any): void {
    const newTab = String(event.index ?? event);
    this.selectedTab = newTab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: newTab },
      queryParamsHandling: 'merge'
    });
  }
}


