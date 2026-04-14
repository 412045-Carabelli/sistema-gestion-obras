import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {Select} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {forkJoin, Observable, Subscription} from 'rxjs';
import {CheckboxModule} from 'primeng/checkbox';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ToastModule} from 'primeng/toast';
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';
import {EditorModule} from 'primeng/editor';
import {FileUploadModule} from 'primeng/fileupload';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';

import {Cliente, Factura, Obra, Transaccion} from '../../../core/models/models';
import {FacturasService} from '../../../services/facturas/facturas.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {FacturasStateService} from '../../../services/facturas/facturas-state.service';

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
    TableModule,
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
    EstadoFormatPipe,
    ToastModule,
    InputNumber,
    DatePicker,
    EditorModule,
    FileUploadModule,
    ModalComponent,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-list.component.html',
  styleUrls: ['./facturas-list.component.css']
})
export class FacturasListComponent implements OnInit, OnDestroy {
  @Output() facturaClick = new EventEmitter<Factura>();

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

  // Modal nueva factura
  showFacturaModal = false;
  facturaForm: {
    id_cliente: number | null;
    id_obra: number | null;
    fecha: Date;
    monto: number | null;
    descripcion: string;
    estado: string;
  } = {
    id_cliente: null,
    id_obra: null,
    fecha: new Date(),
    monto: null,
    descripcion: '',
    estado: 'EMITIDA'
  };
  facturaObrasFiltradas: Obra[] = [];
  facturaFile: File | null = null;
  facturaRestanteObra: number | null = null;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private transaccionesService: TransaccionesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private facturasStateService: FacturasStateService
  ) {
  }

  ngOnInit() {
    this.subscription.add(
      this.facturasStateService.openCreateModal$.subscribe(() => this.abrirFacturaModal())
    );
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private cargarDatos() {
    this.datosCargados = false;
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

  irAlObraDetalle(obraId: number) {
    this.router.navigate(['/obras', obraId], { queryParams: { tab: '3' } });
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
    return this.facturasScope.filter(f => this.obraEsFacturable(f.id_obra));
  }

  private get obrasScopeRequiereFactura(): Obra[] {
    return this.obrasScope.filter(o => this.obraEsFacturable(o.id));
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

  private obraEsFacturable(idObra?: number | null): boolean {
    const id = Number(idObra ?? 0);
    if (!id) return false;
    const obra = this.obrasById.get(id);
    if (!obra || !Boolean(obra.activo ?? true)) return false;
    return Boolean(obra.requiere_factura);
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

  verAdjunto(factura: FacturaView, event: Event) {
    event.stopPropagation();
    if (!factura?.id || !factura?.nombre_archivo) return;
    window.open(this.facturasService.getFacturaUrl(factura.id), '_blank', 'noopener');
  }

  eliminarFactura(factura: FacturaView, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Eliminar factura',
      message: `¿Seguro que querés eliminar la Factura #${factura.id}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.facturasService.deleteFactura(Number(factura.id)).subscribe({
          next: () => {
            this.messageService.add({severity: 'success', summary: 'Factura eliminada', detail: `Factura #${factura.id} eliminada.`});
            this.cargarDatos();
          },
          error: () => {
            this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la factura.'});
          }
        });
      }
    });
  }

  getSiguienteEstadoFacturaIcon(factura: FacturaView): string {
    return (factura.estado || 'EMITIDA').toUpperCase() === 'COBRADA' ? 'pi pi-replay' : 'pi pi-check-circle';
  }

  getSiguienteEstadoFacturaLabel(factura: FacturaView): string {
    return (factura.estado || 'EMITIDA').toUpperCase() === 'COBRADA' ? 'Revertir a emitida' : 'Marcar como cobrada';
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
      impacta_cta_cte: true
    };

    this.facturasService.updateFactura(Number(factura.id), payload).subscribe({
      next: (updated) => {
        this.facturas = this.facturas.map(f => {
          if (Number(f.id) !== Number(factura.id)) return f;
          const porCobrar = this.obtenerPorCobrarFactura({...f, ...updated});
          return {...f, ...updated, porCobrarObra: porCobrar};
        });
        this.construirListadoObras();
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Factura marcada como ${nuevoEstado === 'COBRADA' ? 'cobrada' : 'emitida'}.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la factura.'
        });
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

    return subtotalCostos + beneficioCostos;
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

  // --- Modal nueva factura ---

  abrirFacturaModal() {
    this.resetFacturaForm();
    this.facturaObrasFiltradas = this.obras.filter(o => this.esObraDisponibleParaFacturar(o));
    this.showFacturaModal = true;
  }

  cerrarFacturaModal() {
    this.showFacturaModal = false;
  }

  onFacturaClienteChange() {
    if (!this.facturaForm.id_cliente) {
      this.facturaObrasFiltradas = this.obras.filter(o => this.esObraDisponibleParaFacturar(o));
      this.facturaForm.id_obra = null;
      this.facturaRestanteObra = null;
      return;
    }
    this.facturaObrasFiltradas = this.obras.filter(o =>
      Number(o.cliente?.id) === Number(this.facturaForm.id_cliente) && this.esObraDisponibleParaFacturar(o)
    );
    this.facturaForm.id_obra = null;
    this.facturaRestanteObra = null;
  }

  onFacturaObraChange() {
    const obraId = this.facturaForm.id_obra;
    if (!obraId) {
      this.facturaRestanteObra = null;
      return;
    }
    this.actualizarRestanteFacturaObra(Number(obraId));
  }

  onFacturaFileSelected(event: any) {
    const files = event?.currentFiles ?? event?.files ?? [];
    this.facturaFile = files?.[0] ?? null;
  }

  quitarFacturaArchivo() {
    this.facturaFile = null;
  }

  guardarFactura() {
    if (!this.facturaForm.id_cliente) {
      this.messageService.add({severity: 'warn', summary: 'Campo requerido', detail: 'Selecciona un cliente.'});
      return;
    }
    const monto = Number(this.facturaForm.monto ?? 0);
    if (!monto || monto <= 0) {
      this.messageService.add({severity: 'warn', summary: 'Monto invalido', detail: 'Ingresa un monto mayor a 0.'});
      return;
    }
    if (this.facturaRestanteObra != null && monto > this.facturaRestanteObra + 0.01) {
      this.messageService.add({severity: 'warn', summary: 'Monto invalido', detail: 'El monto supera el restante disponible de la obra.'});
      return;
    }
    const estado = (this.facturaForm.estado || 'EMITIDA').toUpperCase();
    const payload = {
      id_cliente: Number(this.facturaForm.id_cliente),
      id_obra: this.facturaForm.id_obra != null ? Number(this.facturaForm.id_obra) : null,
      monto,
      monto_restante: estado === 'COBRADA' ? 0 : monto,
      fecha: this.formatDate(this.facturaForm.fecha),
      descripcion: this.facturaForm.descripcion || '',
      estado: this.facturaForm.estado || 'EMITIDA'
    };
    this.facturasService.createFactura(payload, this.facturaFile).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Factura creada', detail: 'La factura se guardo correctamente.'});
        this.cerrarFacturaModal();
        this.resetFacturaForm();
        this.cargarDatos();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo crear la factura.';
        this.messageService.add({severity: 'error', summary: 'Error', detail});
      }
    });
  }

  private resetFacturaForm() {
    this.facturaForm = {
      id_cliente: null,
      id_obra: null,
      fecha: new Date(),
      monto: null,
      descripcion: '',
      estado: 'EMITIDA'
    };
    this.facturaFile = null;
    this.facturaRestanteObra = null;
  }

  private esObraDisponibleParaFacturar(obra: Obra): boolean {
    return Boolean(obra.requiere_factura) && Boolean(obra.activo ?? true);
  }

  private actualizarRestanteFacturaObra(obraId: number) {
    const obra = this.obras.find(o => Number(o.id) === Number(obraId));
    const presupuesto = Number(obra?.presupuesto ?? NaN);
    if (!Number.isFinite(presupuesto)) {
      this.facturaRestanteObra = null;
      return;
    }
    this.facturasService.getFacturasByObra(obraId).subscribe({
      next: (facturas) => {
        const facturado = (facturas || []).reduce((sum, f) => sum + Number(f.monto || 0), 0);
        this.facturaRestanteObra = Math.max(0, presupuesto - facturado);
      },
      error: () => {
        this.facturaRestanteObra = null;
      }
    });
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
