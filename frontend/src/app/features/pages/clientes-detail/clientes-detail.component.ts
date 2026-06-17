import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {ToastModule} from 'primeng/toast';
import {MessageService, ConfirmationService, MenuItem} from 'primeng/api';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {DatePipe} from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {MenuModule} from 'primeng/menu';
import {CheckboxModule} from 'primeng/checkbox';
import {FormsModule} from '@angular/forms';
import {ConfirmDialog} from 'primeng/confirmdialog';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {CurrencyPipe, CommonModule} from '@angular/common';

import {Cliente, CondicionIva, CONDICION_IVA_LABELS, Obra, Transaccion} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ClienteStateService} from '../../../services/clientes/clientes-state.service';
import {StyleClass} from 'primeng/styleclass';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ReportesService} from '../../../services/reportes/reportes.service';

@Component({
  selector: 'app-clientes-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    TagModule,
    ClientesDocumentosComponent,
    CurrencyPipe,
    StyleClass,
    EstadoFormatPipe,
    MenuModule,
    CheckboxModule,
    FormsModule,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clientes-detail.component.html',
  styleUrls: ['./clientes-detail.component.css']
})
export class ClientesDetailComponent implements OnInit, OnDestroy {
  cliente!: Cliente;
  obras: Obra[] = [];
  transacciones: Transaccion[] = [];
  loading = true;
  selectedTab = '0';

  // Estadísticas desde el backend
  obrasActivas = 0;
  totalPresupuestado = 0;
  saldoPendiente = 0;
  totalCobrosCliente = 0;
  obrasSaldo: Array<{ id: number; nombre: string; estado: string; total: number; cobrado: number; saldo: number }> = [];

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
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private clienteStateService: ClienteStateService,
    private reportesService: ReportesService,
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
    this.clienteStateService.clearCliente();
  }

  editarCliente() {
    this.router.navigate(['/clientes/editar', this.cliente.id]);
  }

  toggleActivo() {
    const actualizado = {...this.cliente, activo: !this.cliente.activo};
    this.clientesService.updateCliente(this.cliente.id!, actualizado).subscribe({
      next: (c) => {
        this.cliente = c;
        this.clienteStateService.setCliente(this.cliente);

        this.messageService.add({
          severity: 'success',
          summary: this.cliente.activo ? 'Cliente activado' : 'Cliente desactivado',
          detail: `El cliente fue ${this.cliente.activo ? 'activado' : 'desactivado'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del cliente.'
        });
      }
    });
  }

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id]);
  }

  irAObraPorId(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    this.router.navigate(['/obras', id]);
  }

  irAObraDesdeMovimiento(mov: Transaccion) {
    const obraId = Number(mov?.id_obra ?? (mov as any)?.idObra ?? 0);
    if (!Number.isFinite(obraId) || obraId <= 0) return;
    this.router.navigate(['/obras', obraId]);
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getCondicionIvaLabel(condicion: CondicionIva | string | null | undefined): string {
    if (!condicion) return 'Sin dato';

    const normalized = condicion.toString().trim();
    const key = normalized.toUpperCase().replace(/\s+/g, '_') as CondicionIva;

    return CONDICION_IVA_LABELS[key] ?? normalized;
  }

  getEstadosResumen(): { nombre: string; cantidad: number }[] {
    if (!this.obras || this.obras.length === 0) {
      return [];
    }

    const mapa: Record<string, number> = {};

    for (const obra of this.obras) {
      const estado = obra.obra_estado || 'Sin estado';
      mapa[estado] = (mapa[estado] || 0) + 1;
    }

    return Object.entries(mapa)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  private cargarDetalle(idCliente: number) {
    this.loading = true;

    forkJoin({
      cliente: this.clientesService.getClienteById(idCliente),
      obras: this.obrasService.getObras(),
      transacciones: this.transaccionesService.getByAsociado('CLIENTE', idCliente),
      saldos: this.reportesService.getSaldosCliente(idCliente)
    }).subscribe({
      next: ({cliente, obras, transacciones, saldos}) => {
        this.cliente = cliente;
        this.clienteStateService.setCliente(this.cliente);

        // Filtrar obras del cliente (fallback si no vienen en el DTO)
        const obrasDto = (cliente as any)?.obras as Obra[] | undefined;
        this.obras = (obrasDto && obrasDto.length)
          ? obrasDto
          : obras.filter(o => o.cliente?.id === idCliente);

        const mapaObras = new Map<number, string>(
          this.obras
            .filter(o => o.id !== undefined)
            .map(o => [Number(o.id), o.nombre])
        );

        this.transacciones = [...(transacciones || [])]
          .map(t => ({
            ...t,
            obraNombre: t.id_obra ? mapaObras.get(Number(t.id_obra)) : undefined
          }))
          .sort((a, b) =>
            new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime()
          );

        // Usar saldos del backend
        this.totalPresupuestado = saldos.totalPresupuestado;
        this.totalCobrosCliente = saldos.totalCobrado;
        this.saldoPendiente = saldos.saldo;
        this.obrasActivas = saldos.obras.length;
        this.obrasSaldo = saldos.obras.map(o => ({
          id: o.obraId,
          nombre: o.nombre,
          estado: o.estado,
          total: o.presupuestado,
          cobrado: o.cobrado || 0,
          saldo: o.saldo
        })).sort((a, b) => b.saldo - a.saldo);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.clienteStateService.clearCliente();

        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar',
          detail: 'No se pudo obtener la información del cliente.'
        });
      }
    });
  }

  getObrasSaldoCliente(): Array<{ id: number; nombre: string; estado: string; total: number; cobrado: number; saldo: number }> {
    return this.obrasSaldo;
  }

  // ===== EXPORTAR CUENTA CORRIENTE PDF =====

  seleccionarModoExportacion(modo: 'todas' | 'algunas') {
    this.modoExportacion = modo;
    if (modo === 'todas') {
      this.generarCtaCte();
    }
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
    if (!this.cliente?.id) return;
    if (this.generandoPdf) {
      this.messageService.add({
        severity: 'warn',
        summary: 'PDF en proceso',
        detail: 'Espera a que termine la generación actual.'
      });
      return;
    }

    let obraIds: number[] = [];
    if (obraId) {
      obraIds = [obraId];
    } else if (this.modoExportacion === 'todas') {
      obraIds = this.getObrasSaldoCliente().map(o => o.id);
    } else if (this.modoExportacion === 'algunas') {
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

    this.reportesService.getCuentaCorrientePdfCliente(
      this.cliente.id!,
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

    const fechas: string[] = (data.fechasUnicas || []).map((f: string) => {
      const date = new Date(f);
      return datePipe.transform(date, 'dd/MM/yyyy') ?? f;
    });

    const encabezados = [headerCell('Obra'), ...fechas.map(f => headerCell(f))];

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
        { text: `Cliente: ${data.asociadoNombre || 'N/A'}`, fontSize: 10, margin: [0, 0, 0, 2] },
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
      const nombreArchivo = `CtaCte_Cliente_${data.asociadoNombre}_${hoy.replace(/\//g, '-')}.pdf`;
      pdfMake.createPdf(docDefinition).download(nombreArchivo);
      pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, nombreArchivo);
        formData.append('tipo_documento', 'OTRO');
        formData.append('id_asociado', String(data.asociadoId));
        formData.append('tipo_asociado', 'CLIENTE');
        formData.append('observacion', `Cuenta corriente generada el ${hoy}`);

        this.http.post(`${environment.apiGateway}/bff/documentos`, formData).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Cta. cte. guardada en documentos.' }),
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

