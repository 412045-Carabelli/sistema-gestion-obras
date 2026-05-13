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
    InputTextarea
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

  // Opciones para filtros y modal
  obraNombresMap: { [key: number]: string } = {};
  asociadoNombresMap: { [key: string]: string } = {};
  obrasOptions: Obra[] = [];
  clientesOptions: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  proveedoresOptions: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  obraSeleccionada: Obra | null = null;

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

  private cargarDatos(): void {
    forkJoin({
      movimientosPage: this.movimientosService.listarConAsociados(this.currentPage, this.pageSize),
      obras: this.obrasService.getObras(),
      clientes: this.clientesService.getClientes(),
      proveedores: this.proveedoresService.getProveedores()
    }).subscribe({
      next: ({ movimientosPage, obras, clientes, proveedores }) => {
        this.movimientos = movimientosPage.content || [];
        this.totalElements = movimientosPage.totalElements || 0;
        this.obrasOptions = obras;
        this.clientesOptions = clientes;
        this.proveedoresOptions = proveedores;

        // Mapear nombres de obras
        obras.forEach(o => {
          this.obraNombresMap[o.id!] = o.nombre;
        });

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
    return mov.nombre_asociado || `${mov.tipo_asociado} ${mov.id_asociado}`;
  }

  onFilterChange() {
    this.applyFilter();
  }

  onAsociadoChange(): void {
    const idAsociado = this.form.get('id_asociado')?.value;
    const tipoAsociado = this.form.get('tipo_asociado')?.value;

    this.saldoAsociado = 0;

    if (!idAsociado) return;

    if (tipoAsociado === 'CLIENTE') {
      const cliente = this.clientesFiltrados.find(c => c.id === idAsociado);
      if (cliente) {
        this.saldoAsociado = cliente.saldoCliente || 0;
      }
    } else if (tipoAsociado === 'PROVEEDOR') {
      const proveedor = this.proveedoresFiltrados.find(p => p.id === idAsociado);
      if (proveedor) {
        this.saldoAsociado = proveedor.saldoProveedor || 0;
      }
    }

    // Auto-rellenar monto si forma_pago es TOTAL (solo en create/view, no en edit)
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
    this.onObraChange();
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
    this.clientesFiltrados = [];
    this.proveedoresFiltrados = [];
    this.obraSeleccionada = null;
    this.saldoAsociado = 0;
    this.showModal = true;
  }

  onObraChange(): void {
    const obraId = this.form.get('id_obra')?.value;
    if (!obraId) {
      this.clientesFiltrados = [];
      this.proveedoresFiltrados = [];
      this.obraSeleccionada = null;
      this.form.patchValue({ id_asociado: null });
      return;
    }

    this.obraSeleccionada = this.obrasOptions.find(o => o.id === obraId) || null;

    if (this.obraSeleccionada) {
      // Filtrar cliente de la obra
      const clienteObra = this.obraSeleccionada.cliente;
      this.clientesFiltrados = clienteObra ? [clienteObra] : [];

      // Cargar todos los proveedores disponibles
      this.proveedoresFiltrados = this.proveedoresOptions;
    }

    // No resetear id_asociado para mantener el valor existente en edición o view
    if (!this.isEditMode && !this.isViewMode) {
      this.form.patchValue({ id_asociado: null });
    }
  }

  openEditModal(mov: Movimiento) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.movimientoEditando = mov;
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
    // Filtrar clientes/proveedores de la obra seleccionada
    this.onObraChange();
    // Cargar saldo del asociado
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
      fecha: this.form.get('fecha')?.value?.toISOString().split('T')[0]
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
