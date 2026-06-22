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
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { Movimiento, Obra, Cliente, Proveedor, RecordOption } from '../../../core/models/models';
import { MovimientosService } from '../../../services/movimientos/movimientos.service';
import { MovimientosModalService } from '../../../services/movimientos/movimientos-modal.service';
import { ObrasService } from '../../../services/obras/obras.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
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
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    Select,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    DialogModule,
    InputTextarea,
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
  isEditMode = false;
  isViewMode = false;
  form!: FormGroup;
  movimientoEditando: Movimiento | null = null;
  saldoAsociado: number = 0;
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];

  // Opciones para filtros y modal
  obraNombresMap: { [key: number]: string } = {};
  asociadoNombresMap: { [key: string]: string } = {};
  obrasOptions: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  clientesOptions: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  proveedoresOptions: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];

  tiposTransaccion: { label: string; name: string }[] = [
    { label: 'Todos', name: 'todos' },
    { label: 'Cobro', name: 'COBRO' },
    { label: 'Pago', name: 'PAGO' }
  ];
  tiposAsociado: { label: string; name: string }[] = [
    { label: 'Todos', name: 'todos' },
    { label: 'Cliente', name: 'CLIENTE' },
    { label: 'Proveedor', name: 'PROVEEDOR' }
  ];
  formasPago: { label: string; name: string }[] = [
    { label: 'Todas', name: 'todos' },
    { label: 'Parcial', name: 'PARCIAL' },
    { label: 'Total', name: 'TOTAL' }
  ];
  mediosPago: { label: string; name: string }[] = [];

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
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      id_obra: [null, Validators.required],
      id_asociado: [null, Validators.required],
      tipo_asociado: ['CLIENTE', Validators.required],
      tipo_transaccion: ['COBRO', Validators.required],
      fecha: [null, Validators.required],
      monto: [null, Validators.required],
      forma_pago: ['TOTAL', Validators.required],
      medio_pago: [''],
      concepto: ['']
    });
  }

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
        options: this.tiposTransaccion.map((t) => ({ label: t.label, value: t.name }))
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

        // Mapear nombres de obras
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

  onTipoAsociadoChange(): void {
    if (this.isEditMode || this.isViewMode) return;
    this.form.patchValue({ id_asociado: null, id_obra: null });
    this.obrasFiltradas = [];
    this.saldoAsociado = 0;
  }

  onAsociadoChange(): void {
    const idAsociado = this.form.get('id_asociado')?.value;
    const tipoAsociado = this.form.get('tipo_asociado')?.value;

    this.saldoAsociado = 0;

    if (!idAsociado) {
      if (!this.isEditMode && !this.isViewMode) {
        this.obrasFiltradas = [];
      }
      return;
    }

    if (tipoAsociado === 'CLIENTE') {
      const cliente = this.clientesOptions.find(c => c.id === idAsociado);
      if (cliente) {
        this.saldoAsociado = cliente.saldoCliente || 0;
      }
      // Filtrar obras por cliente
      if (!this.isEditMode && !this.isViewMode) {
        this.obrasFiltradas = this.obrasOptions.filter(
          o => o.id_cliente === idAsociado || o.cliente?.id === idAsociado
        );
        this.form.patchValue({ id_obra: null });
      }
    } else if (tipoAsociado === 'PROVEEDOR') {
      const proveedor = this.proveedoresOptions.find(p => p.id === idAsociado);
      if (proveedor) {
        this.saldoAsociado = proveedor.saldoProveedor || 0;
      }
      // Mostrar todas las obras activas para proveedor
      if (!this.isEditMode && !this.isViewMode) {
        this.obrasFiltradas = this.obrasOptions;
        this.form.patchValue({ id_obra: null });
      }
    }

    // Auto-rellenar monto si forma_pago es TOTAL (solo en create, no en edit/view)
    if (!this.isEditMode && !this.isViewMode) {
      this.actualizarMonto();
    }
  }

  onFormaPagoChange(): void {
    this.actualizarMonto();
  }

  private actualizarMonto(): void {
    const formaPago = this.form.get('forma_pago')?.value;

    if (formaPago === 'TOTAL') {
      this.form.patchValue({ monto: this.saldoAsociado });
    } else if (formaPago === 'PARCIAL') {
      this.form.patchValue({ monto: 0 });
    }
  }

  onRowClick(mov: Movimiento) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.openViewModal(mov);
  }

  openViewModal(mov: Movimiento) {
    this.movimientoEditando = mov;
    this.clientesFiltrados = this.clientesOptions;
    this.proveedoresFiltrados = this.proveedoresOptions;
    this.obrasFiltradas = this.obrasOptions;
    this.form.patchValue({
      id_obra: mov.id_obra,
      id_asociado: mov.id_asociado,
      tipo_asociado: mov.tipo_asociado,
      tipo_transaccion: mov.tipo_transaccion,
      fecha: new Date(mov.fecha),
      monto: mov.monto,
      forma_pago: mov.forma_pago,
      medio_pago: mov.medio_pago || '',
      concepto: mov.concepto || ''
    });
    this.onAsociadoChange();
    this.form.disable();
    this.showModal = true;
  }

  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.form.enable();
    this.form.reset({
      tipo_asociado: 'CLIENTE',
      tipo_transaccion: 'COBRO',
      forma_pago: 'TOTAL',
      fecha: new Date()
    });
    this.clientesFiltrados = this.clientesOptions;
    this.proveedoresFiltrados = this.proveedoresOptions;
    this.obrasFiltradas = [];
    this.saldoAsociado = 0;
    this.showModal = true;
  }

  openEditModal(mov: Movimiento) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.movimientoEditando = mov;
    this.clientesFiltrados = this.clientesOptions;
    this.proveedoresFiltrados = this.proveedoresOptions;
    this.obrasFiltradas = this.obrasOptions;
    this.form.enable();
    this.form.patchValue({
      id_obra: mov.id_obra,
      id_asociado: mov.id_asociado,
      tipo_asociado: mov.tipo_asociado,
      tipo_transaccion: mov.tipo_transaccion,
      fecha: new Date(mov.fecha),
      monto: mov.monto,
      forma_pago: mov.forma_pago,
      medio_pago: mov.medio_pago || '',
      concepto: mov.concepto || ''
    });
    this.onAsociadoChange();
    this.showModal = true;
  }

  guardarMovimiento() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.getRawValue(),
      fecha: (() => { const d = this.form.get('fecha')?.value; return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : null; })()
    };

    const accion = this.isEditMode && this.movimientoEditando
      ? this.movimientosService.actualizar(this.movimientoEditando.id, payload)
      : this.movimientosService.crear(payload);

    accion.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditMode ? 'Movimiento actualizado' : 'Movimiento creado'
        });
        this.showModal = false;
        this.movimientoEditando = null;
        this.isViewMode = false;
        this.cargarDatos();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el movimiento'
        });
      }
    });
  }

  exportarPDF() {
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

  eliminarMovimiento(mov: Movimiento) {
    this.movimientosService.eliminar(mov.id).subscribe({
      next: () => {
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el movimiento'
        });
      }
    });
  }
}
