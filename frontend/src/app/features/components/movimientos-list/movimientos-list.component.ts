import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../../shared/modal/modal.component';

import { Movimiento, Obra, ObraCosto, Cliente, Proveedor } from '../../../core/models/models';
import { MovimientosService } from '../../../services/movimientos/movimientos.service';
import { MovimientosModalService } from '../../../services/movimientos/movimientos-modal.service';
import { ObrasService } from '../../../services/obras/obras.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import { CostosService } from '../../../services/costos/costos.service';
import { GenericFilterBarComponent, FilterDefinition, FilterAction } from '../generic-filter-bar/generic-filter-bar.component';
import { EstadoFormatPipe } from '../../../shared/pipes/estado-format.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    Select,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    RadioButtonModule,
    TagModule,
    ModalComponent,
    GenericFilterBarComponent,
    EstadoFormatPipe
  ],
  templateUrl: './movimientos-list.component.html',
  styleUrls: ['./movimientos-list.component.css'],
  providers: [MessageService]
})
export class MovimientosListComponent implements OnInit {
  @Input() movimientos: Movimiento[] = [];
  @Output() movimientoClick = new EventEmitter<Movimiento>();

  movimientosFiltrados: Movimiento[] = [];
  datosCargados = false;
  showModal = false;
  modoEdicion = false;
  isViewMode = false;
  guardandoMovimiento = false;
  eliminandoMovimiento = false;

  // Modal form state (ngModel-based)
  tipoEntidad: 'PROVEEDOR' | 'CLIENTE' = 'CLIENTE';
  selectedObra: Obra | null = null;
  selectedProveedor: Proveedor | null = null;
  selectedCliente: Cliente | null = null;
  clientesFiltrados: Cliente[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  nuevoMovimiento: any = {};

  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];

  // Opciones para filtros y modal
  obraNombresMap: { [key: number]: string } = {};
  obrasOptions: Obra[] = [];
  clientesOptions: Cliente[] = [];
  proveedoresOptions: Proveedor[] = [];
  costosObra: ObraCosto[] = [];
  saldoPorProveedor: Map<number, number> = new Map();

  tiposTransaccionFiltro: { label: string; name: string }[] = [
    { label: 'Todos', name: 'todos' },
    { label: 'Cobro', name: 'COBRO' },
    { label: 'Pago', name: 'PAGO' }
  ];
  tiposTransaccionModal: { label: string; name: string }[] = [
    { label: 'Cobro', name: 'COBRO' },
    { label: 'Pago', name: 'PAGO' }
  ];

  // Filtros
  searchValue: string = '';
  tipoTransaccionFiltro: string = 'todos';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  currentPage = 0;
  pageSize = 50;
  totalElements = 0;

  constructor(
    private router: Router,
    private movimientosService: MovimientosService,
    private movimientosModalService: MovimientosModalService,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private proveedoresService: ProveedoresService,
    private costosService: CostosService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.cargarDatos();
    this.movimientosModalService.abrirModal$.subscribe(() => {
      this.openCreateModal();
    });
  }

  private setupFilterDefinitions(): void {
    this.filterActions = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'danger',
        callback: () => this.exportarPDF()
      }
    ];

    this.filterDefinitions = [
      {
        key: 'search',
        label: 'Buscar',
        type: 'input',
        placeholder: 'Nombre asociado...'
      },
      {
        key: 'tipoTransaccion',
        label: 'Tipo Transacción',
        type: 'select',
        placeholder: 'Todos',
        options: this.tiposTransaccionFiltro.map((t) => ({ label: t.label, value: t.name }))
      },
      {
        key: 'fechaInicio',
        label: 'Fecha Inicio',
        type: 'date'
      },
      {
        key: 'fechaFin',
        label: 'Fecha Fin',
        type: 'date'
      }
    ];
  }

  private cargarDatos(): void {
    forkJoin({
      movimientosPage: this.movimientosService.listarConAsociados(this.currentPage, this.pageSize),
      obras: this.obrasService.getObrasParaMovimientos(),
      clientes: this.clientesService.getClientes(),
      proveedores: this.proveedoresService.getProveedores()
    }).subscribe({
      next: ({ movimientosPage, obras, clientes, proveedores }) => {
        this.movimientos = movimientosPage.content || [];
        this.totalElements = movimientosPage.totalElements || 0;
        this.obrasOptions = obras.filter(o => o.activo !== false).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        this.clientesOptions = [...clientes].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        this.proveedoresOptions = [...proveedores].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        obras.forEach(o => {
          this.obraNombresMap[o.id!] = o.nombre;
        });

        this.setupFilterDefinitions();
        this.applyFilter();
        this.datosCargados = true;
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos'
        });
        this.datosCargados = true;
      }
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.searchValue = filters['search'] || '';
    this.tipoTransaccionFiltro = filters['tipoTransaccion'] || 'todos';
    this.fechaInicio = filters['fechaInicio'] ? new Date(filters['fechaInicio']) : null;
    this.fechaFin = filters['fechaFin'] ? new Date(filters['fechaFin']) : null;
    this.applyFilter();
  }

  onClearFilters(): void {
    this.searchValue = '';
    this.tipoTransaccionFiltro = 'todos';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.applyFilter();
  }

  applyFilter() {
    this.movimientosFiltrados = this.movimientos
      .filter(mov => {
        const matchesSearch = this.searchValue
          ? this.getNombreAsociado(mov).toLowerCase().includes(this.searchValue.toLowerCase())
          : true;

        const matchesTipoTransaccion = this.tipoTransaccionFiltro === 'todos'
          ? true
          : mov.tipo_transaccion === this.tipoTransaccionFiltro;

        const movFecha = new Date(mov.fecha);
        const matchesFechaInicio = !this.fechaInicio || movFecha >= this.fechaInicio;
        const matchesFechaFin = !this.fechaFin || movFecha <= this.fechaFin;

        return matchesSearch && matchesTipoTransaccion && matchesFechaInicio && matchesFechaFin;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  getNombreObra(id: number): string {
    return this.obraNombresMap[id] || `Obra ${id}`;
  }

  getNombreAsociado(mov: Movimiento): string {
    if (mov.nombre_asociado) return mov.nombre_asociado;
    if (mov.tipo_asociado === 'CLIENTE') {
      const c = this.clientesOptions.find(x => x.id === mov.id_asociado);
      if (c) return c.nombre;
    } else if (mov.tipo_asociado === 'PROVEEDOR') {
      const p = this.proveedoresOptions.find(x => x.id === mov.id_asociado);
      if (p) return p.nombre;
    }
    return `${mov.tipo_asociado} ${mov.id_asociado}`;
  }

  // --- MODAL ---

  onTipoEntidadChange(): void {
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.asegurarTipoTransaccionSegunAsociado();
    this._filtrarAsociadosPorObra();
  }

  onObraChange(): void {
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.nuevoMovimiento.id_obra = this.selectedObra?.id ?? null;
    this.costosObra = [];
    this.saldoPorProveedor.clear();
    this._filtrarAsociadosPorObra();

    if (this.selectedObra?.id) {
      this.costosService.getByObra(this.selectedObra.id).subscribe({
        next: (costos) => {
          this.costosObra = costos || [];
          this._computarSaldosPorProveedor();
        },
        error: () => { this.costosObra = []; }
      });
    }
  }

  private _filtrarAsociadosPorObra(): void {
    if (!this.selectedObra) {
      this.clientesFiltrados = [];
      this.proveedoresFiltrados = [];
      return;
    }
    const obraClienteId = this.selectedObra.id_cliente ?? this.selectedObra.cliente?.id;
    this.clientesFiltrados = obraClienteId
      ? this.clientesOptions.filter(c => c.id === obraClienteId)
      : this.clientesOptions;
    this.proveedoresFiltrados = this.proveedoresOptions;
  }

  onClienteSeleccionado(): void {
    this.aplicarMontoSegunAsociado();
  }

  onProveedorSeleccionado(): void {
    this.aplicarMontoSegunAsociado();
  }

  onFormaPagoChange(value: 'TOTAL' | 'PARCIAL'): void {
    if (value === 'PARCIAL') {
      this.nuevoMovimiento.monto = 0;
      return;
    }
    this.aplicarMontoSegunAsociado();
  }

  onMontoChange(value: any): void {
    const monto = Number(value ?? this.nuevoMovimiento.monto ?? 0);
    if (!Number.isFinite(monto) || monto < 0) return;
    this.nuevoMovimiento.monto = monto;
    this.ajustarFormaPagoSegunMonto(monto);
  }

  private _computarSaldosPorProveedor(): void {
    this.saldoPorProveedor.clear();
    if (!this.selectedObra || !this.costosObra.length) return;
    const obraId = this.selectedObra.id!;

    for (const costo of this.costosObra) {
      const provId = Number((costo as any).id_proveedor ?? (costo as any).proveedor?.id ?? 0);
      if (!provId) continue;
      const totalCosto = this._getMontoBaseCosto(costo);
      const pagado = this.movimientos
        .filter(m => m.id_obra === obraId && m.id_asociado === provId && m.tipo_asociado === 'PROVEEDOR')
        .reduce((sum, m) => sum + (m.monto || 0), 0);
      const prev = this.saldoPorProveedor.get(provId) || 0;
      this.saldoPorProveedor.set(provId, prev + Math.max(0, totalCosto - pagado));
    }
  }

  private _getMontoBaseCosto(costo: ObraCosto): number {
    const montoReal = Number((costo as any).monto_real ?? NaN);
    if (!Number.isNaN(montoReal) && montoReal > 0) return montoReal;
    const subtotal = Number(costo.subtotal ?? NaN);
    if (!Number.isNaN(subtotal) && subtotal > 0) return subtotal;
    return Number(costo.cantidad ?? 0) * Number(costo.precio_unitario ?? 0);
  }

  getSaldoProveedor(proveedorId: number): number {
    return this.saldoPorProveedor.get(proveedorId) || 0;
  }

  private _getSaldoAsociadoActual(): number {
    if (this.tipoEntidad === 'CLIENTE') return this.selectedCliente?.saldoCliente || 0;
    if (this.selectedProveedor) return this.getSaldoProveedor(this.selectedProveedor.id);
    return 0;
  }

  get saldoAsociadoActual(): number {
    return this._getSaldoAsociadoActual();
  }

  private aplicarMontoSegunAsociado(): void {
    const formaPago = (this.nuevoMovimiento.forma_pago || '').toUpperCase();
    if (formaPago === 'PARCIAL') return;
    this.nuevoMovimiento.monto = this._getSaldoAsociadoActual();
  }

  private ajustarFormaPagoSegunMonto(monto: number): void {
    const EPS = 0.01;
    const saldo = this._getSaldoAsociadoActual();
    if (Math.abs(monto - saldo) < EPS) {
      this.nuevoMovimiento.forma_pago = 'TOTAL';
    } else if (monto < saldo) {
      this.nuevoMovimiento.forma_pago = 'PARCIAL';
    }
  }

  private asegurarTipoTransaccionSegunAsociado(): void {
    this.nuevoMovimiento.tipo_transaccion = this.tipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
  }

  getTiposTransaccionDisponibles(): { label: string; name: string }[] {
    const requerido = this.tipoEntidad === 'PROVEEDOR' ? 'PAGO' : 'COBRO';
    const filtrados = this.tiposTransaccionModal.filter(t => t.name === requerido);
    if (filtrados.length > 0) return filtrados;
    return [{ label: requerido === 'PAGO' ? 'Pago' : 'Cobro', name: requerido }];
  }

  getTipoTransaccionDisponibleLabel(): string {
    const opciones = this.getTiposTransaccionDisponibles();
    if (!opciones.length) return '';
    return opciones[0].label || opciones[0].name;
  }

  getTipoTransaccionSeverity(): 'success' | 'danger' | 'info' {
    const opciones = this.getTiposTransaccionDisponibles();
    const name = (opciones[0]?.name || '').toUpperCase();
    if (name === 'COBRO') return 'success';
    if (name === 'PAGO') return 'danger';
    return 'info';
  }

  // --- ROW CLICK / OPEN MODALS ---

  onRowClick(mov: Movimiento): void {
    this.openViewModal(mov);
  }

  openViewModal(mov: Movimiento): void {
    this.modoEdicion = false;
    this.isViewMode = true;
    this._poblarModal(mov);
    this.showModal = true;
  }

  openCreateModal(): void {
    this.modoEdicion = false;
    this.isViewMode = false;
    this.selectedObra = null;
    this.selectedCliente = null;
    this.selectedProveedor = null;
    this.clientesFiltrados = [];
    this.proveedoresFiltrados = [];
    this.tipoEntidad = 'CLIENTE';
    this.nuevoMovimiento = {
      tipo_transaccion: 'COBRO',
      fecha: new Date(),
      monto: 0,
      forma_pago: 'TOTAL',
      medio_pago: 'Transferencia',
      tipo_asociado: 'CLIENTE',
      concepto: ''
    };
    this.showModal = true;
  }

  openEditModal(mov: Movimiento): void {
    this.modoEdicion = true;
    this.isViewMode = false;
    this._poblarModal(mov);
    this.showModal = true;
  }

  private _poblarModal(mov: Movimiento): void {
    this.tipoEntidad = (mov.tipo_asociado || 'CLIENTE').toUpperCase() as 'CLIENTE' | 'PROVEEDOR';
    this.selectedObra = this.obrasOptions.find(o => o.id === mov.id_obra) || null;
    this.selectedCliente = null;
    this.selectedProveedor = null;

    if (this.tipoEntidad === 'CLIENTE') {
      this.selectedCliente = this.clientesOptions.find(c => c.id === mov.id_asociado) || null;
      this.clientesFiltrados = this.clientesOptions;
      this.proveedoresFiltrados = [];
    } else {
      this.selectedProveedor = this.proveedoresOptions.find(p => p.id === mov.id_asociado) || null;
      this.clientesFiltrados = [];
      this.proveedoresFiltrados = this.proveedoresOptions;
    }

    this.nuevoMovimiento = {
      ...mov,
      fecha: this.parseFechaLocal(mov.fecha) ?? new Date()
    };
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardarMovimiento(): void {
    const asociadoId = this.tipoEntidad === 'PROVEEDOR'
      ? this.selectedProveedor?.id
      : this.selectedCliente?.id;

    if (!asociadoId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta asociado',
        detail: `Selecciona un ${this.tipoEntidad === 'CLIENTE' ? 'cliente' : 'proveedor'}`
      });
      return;
    }

    if (!this.nuevoMovimiento.id_obra) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta obra',
        detail: 'Selecciona una obra'
      });
      return;
    }

    const payload = {
      ...this.nuevoMovimiento,
      id_asociado: asociadoId,
      tipo_asociado: this.tipoEntidad,
      fecha: this.formatFechaLocal(this.nuevoMovimiento.fecha)
    };

    const accion = this.modoEdicion && this.nuevoMovimiento.id
      ? this.movimientosService.actualizar(this.nuevoMovimiento.id, payload)
      : this.movimientosService.crear(payload);

    this.guardandoMovimiento = true;
    accion.subscribe({
      next: () => {
        this.guardandoMovimiento = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.modoEdicion ? 'Movimiento actualizado' : 'Movimiento creado'
        });
        this.showModal = false;
        this.cargarDatos();
      },
      error: (err) => {
        this.guardandoMovimiento = false;
        const detail = err?.error?.message || 'No se pudo guardar el movimiento';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  eliminarMovimiento(mov: Movimiento): void {
    this.eliminandoMovimiento = true;
    this.movimientosService.eliminar(mov.id).subscribe({
      next: () => {
        this.eliminandoMovimiento = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento eliminado'
        });
        this.showModal = false;
        this.isViewMode = false;
        this.cargarDatos();
      },
      error: (err) => {
        this.eliminandoMovimiento = false;
        const detail = err?.error?.message || 'No se pudo eliminar el movimiento';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      }
    });
  }

  exportarPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toLocaleDateString('es-AR');

    doc.setFontSize(14);
    doc.text('Listado de Movimientos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exportado: ${fecha}`, 14, 22);

    const rows = this.movimientosFiltrados.map(mov => [
      mov.id,
      new Date(mov.fecha).toLocaleDateString('es-AR'),
      this.getNombreObra(mov.id_obra),
      mov.tipo_asociado,
      this.getNombreAsociado(mov),
      mov.tipo_transaccion,
      mov.forma_pago,
      mov.medio_pago || '-',
      `$${(mov.monto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Fecha', 'Obra', 'Tipo Asoc.', 'Asociado', 'Transacción', 'Forma Pago', 'Medio Pago', 'Monto']],
      body: rows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`movimientos-${fecha.replace(/\//g, '-')}.pdf`);
  }

  private parseFechaLocal(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const raw = String(value).split('T')[0];
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      const parsed = new Date(String(value));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  private formatFechaLocal(value: unknown): string | null {
    const date = this.parseFechaLocal(value);
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
