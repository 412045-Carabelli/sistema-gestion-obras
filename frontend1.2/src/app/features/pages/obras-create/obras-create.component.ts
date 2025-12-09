import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, DatePipe} from '@angular/common';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {ObraCostosTableComponent} from '../../components/obra-costos-table/obra-costos-table.component';

import {Cliente, EstadoObra, Proveedor} from '../../../core/models/models';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {CatalogoOption, ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {Checkbox} from 'primeng/checkbox';
import {DatePicker, DatePickerModule} from 'primeng/datepicker';
import {ObraPayload, ObrasService} from '../../../services/obras/obras.service';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {Select} from 'primeng/select';
import {RouterLink} from '@angular/router';
import {PreventInvalidSubmitDirective} from '../../../shared/directives/prevent-invalid-submit.directive';
import {ModalComponent} from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-obras-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    DatePickerModule,
    ButtonModule,
    TooltipModule,
    ObraCostosTableComponent,
    Checkbox,
    ToastModule,
    DatePicker,
    Select,
    RouterLink
    , PreventInvalidSubmitDirective,
    ModalComponent
  ],
  templateUrl: './obras-create.component.html',
  styleUrls: ['./obras-create.component.css'],
  providers: [DatePipe]
})
export class ObrasCreateComponent implements OnInit {
  form: FormGroup;
  clientes: Cliente[] = [];
  estadosRecords: { label: string; name: string }[] = [];
  proveedores: Proveedor[] = [];
  ivaOptions: {label: string; name: string}[] = [];
  tiposProveedor: CatalogoOption[] = [];
  gremiosProveedor: CatalogoOption[] = [];
  clienteForm: FormGroup;
  proveedorForm: FormGroup;
  showClienteModal = false;
  showProveedorModal = false;
  creandoCliente = false;
  creandoProveedor = false;

  constructor(
    private fb: FormBuilder,
    private obrasService: ObrasService,
    private clientesService: ClientesService,
    private estadoObraService: EstadoObraService,
    private proveedoresService: ProveedoresService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      cliente: [null, Validators.required],
      obra_estado: [null, Validators.required],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      fecha_presupuesto: [new Date(), Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin: [null],
      // Campos de adjudicación/perdida removidos del alta
      notas: [''],
      tiene_comision: [false],
      comision: new FormControl({value: null, disabled: true}),
      presupuesto: new FormControl({value: null, disabled: true}),
      beneficio_global: [false],
      beneficio: new FormControl({value: null, disabled: true}),
      costos: this.fb.array([]),
    });

    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      cuit: ['', [Validators.required]],
      condicion_iva: [null, [Validators.required]],
      telefono: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      activo: [true, Validators.required]
    });

    this.proveedorForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo_proveedor: [null, Validators.required],
      gremio: [null, Validators.required],
      contacto: ['', Validators.required],
      direccion: [''],
      cuit: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', Validators.required],
      activo: [true, Validators.required]
    });
  }

  get costos(): FormArray {
    return this.form.get('costos') as FormArray;
  }

  ngOnInit() {
    this.clientesService.getClientes().subscribe(list =>
      this.clientes = list.map(c => ({...c, id: Number(c.id)}))
    );

    this.estadoObraService.getEstados().subscribe(list => {
      this.estadosRecords = list;
      const presupuestada = list.find(e => (e.name || '').toUpperCase() === 'PRESUPUESTADA');
      if (presupuestada) {
        this.form.get('obra_estado')?.setValue(presupuestada.name ?? presupuestada.label);
      }
    });

    this.proveedoresService.getProveedores().subscribe(list =>
      this.proveedores = list.map(p => ({...p, id: Number(p.id)}))
    );

    this.clientesService.getCondicionesIva().subscribe({
      next: data => this.ivaOptions = data,
      error: () => this.ivaOptions = []
    });

    this.proveedoresService.getTipos().subscribe({
      next: t => this.tiposProveedor = t,
      error: () => this.tiposProveedor = []
    });

    this.proveedoresService.getGremios().subscribe({
      next: g => this.gremiosProveedor = g,
      error: () => this.gremiosProveedor = []
    });

    this.form.get('obra_estado')?.valueChanges.subscribe(selected => {
      if (selected) {
      }
    });

    const beneficioCtrl = this.form.get('beneficio');
    const beneficioGlobalCtrl = this.form.get('beneficio_global');
    const comisionCtrl = this.form.get('comision');
    const comisionGlobalCtrl = this.form.get('tiene_comision');

    // ✅ Beneficio global
    beneficioGlobalCtrl?.valueChanges.subscribe((isGlobal: boolean) => {
      if (isGlobal) {
        beneficioCtrl?.enable({emitEvent: false});
        this.costos.controls.forEach(fila => fila.get('beneficio')?.disable({emitEvent: false}));
      } else {
        beneficioCtrl?.disable({emitEvent: false});
        this.costos.controls.forEach(fila => fila.get('beneficio')?.enable({emitEvent: false}));
      }
      this.recalcularTotales();
    });

    beneficioCtrl?.valueChanges.subscribe(() => {
      if (beneficioGlobalCtrl?.value) {
        this.recalcularTotales();
      }
    });

    // ✅ Comisión global
    comisionGlobalCtrl?.valueChanges.subscribe((isGlobal: boolean) => {
      if (isGlobal) {
        comisionCtrl?.enable({emitEvent: false});
      } else {
        comisionCtrl?.disable({emitEvent: false});
      }
      this.recalcularTotales();
    });

    comisionCtrl?.valueChanges.subscribe(() => {
      if (comisionGlobalCtrl?.value) {
        this.recalcularTotales();
      }
    });
  }

  nuevaFilaCosto() {

    const fila = this.fb.group({
      id_proveedor: [null, Validators.required],
      descripcion: ['', Validators.required],
      unidad: [''],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      beneficio: [{value: 0, disabled: this.form.get('beneficio_global')?.value}],
      subtotal: [{value: 0, disabled: true}],
      total: [{value: 0, disabled: true}]
    });

    fila.get('cantidad')?.valueChanges.subscribe(() => this.calcularSubtotal(fila));
    fila.get('precio_unitario')?.valueChanges.subscribe(() => this.calcularSubtotal(fila));
    fila.get('beneficio')?.valueChanges.subscribe(() => this.calcularSubtotal(fila));

    this.costos.push(fila);

  }

  calcularSubtotal(fila: FormGroup) {
    const cantidad = fila.get('cantidad')?.value || 0;
    const precio = fila.get('precio_unitario')?.value || 0;

    const beneficioGlobalActivo = this.form.get('beneficio_global')?.value;
    const beneficioGlobalValor = Number(this.form.get('beneficio')?.value) || 0;
    const beneficioFila = Number(fila.get('beneficio')?.value) || 0;
    const beneficio = beneficioGlobalActivo ? beneficioGlobalValor : beneficioFila;

    let subtotal = cantidad * precio;
    let total = subtotal * (1 + beneficio / 100);

    fila.get('subtotal')?.setValue(subtotal, {emitEvent: false});
    fila.get('total')?.setValue(total, {emitEvent: false});

    this.actualizarPresupuesto();
  }

  actualizarPresupuesto() {
    const totalBase = this.costos.controls.reduce((acc, control) => {
      const t = control.get('total')?.value || 0;
      return acc + t;
    }, 0);

    const tieneComision = this.form.get('tiene_comision')?.value;
    const comisionValor = Number(this.form.get('comision')?.value) || 0;
    const totalConComision = tieneComision ? totalBase * (1 + comisionValor / 100) : totalBase;

    this.form.get('presupuesto')?.setValue(totalConComision);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: ObraPayload = {
      id_cliente: raw.cliente?.id ?? raw.cliente ?? 0,
      obra_estado: (raw.obra_estado?.name ?? raw.obra_estado),
      nombre: raw.nombre,
      direccion: raw.direccion,
      fecha_presupuesto: this.formatToLocalDateTime(raw.fecha_presupuesto),
      fecha_inicio: this.formatToLocalDateTime(raw.fecha_inicio),
      fecha_fin: this.formatToLocalDateTime(raw.fecha_fin),
      // No enviar fechas adjudicada/perdida en creación
      notas: raw.notas?.trim() || undefined,
      presupuesto: raw.presupuesto ?? 0,
      beneficio_global: raw.beneficio_global,
      beneficio: raw.beneficio ?? 0,
      tiene_comision: raw.tiene_comision || false,
      comision: raw.comision,
      costos: (raw.costos || []).map((c: any) => ({
        id_proveedor: c.id_proveedor,
        descripcion: c.descripcion,
        unidad: c.unidad,
        cantidad: c.cantidad,
        subtotal: c.total,
        precio_unitario: c.precio_unitario,
        beneficio: c.beneficio ?? 0,
        id_estado_pago: 1
      })),
      tareas: []
    };


    this.obrasService.createObra(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Obra creada',
          detail: 'La obra se creó correctamente ✅',
          life: 3000
        });

        this.form.reset();
        this.form.patchValue({
          fecha_presupuesto: new Date(),
          fecha_inicio: new Date(),
          tiene_comision: false,
          beneficio_global: false,
        });
        this.form.get('beneficio')?.disable({emitEvent: false});
        this.form.get('comision')?.disable({emitEvent: false});
        this.costos.clear();
      },
      error: (err) => {
        console.error('❌ Error al crear obra', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la obra.',
          life: 3000
        });
      }
    });
  }

  private recalcularTotales() {
    this.costos.controls.forEach(fila => this.calcularSubtotal(fila as FormGroup));
  }

  get fechasFueraDeRango(): boolean {
    const inicio = this.form.get('fecha_inicio')?.value ? new Date(this.form.get('fecha_inicio')?.value) : null;
    const fin = this.form.get('fecha_fin')?.value ? new Date(this.form.get('fecha_fin')?.value) : null;
    if (!inicio || !fin) return false;
    return fin.getTime() < inicio.getTime();
  }

  private formatToLocalDateTime(value: Date | string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    return date.toISOString().replace('Z', '');
  }

  abrirModalCliente() {
    this.clienteForm.reset({
      nombre: '',
      contacto: '',
      cuit: '',
      condicion_iva: null,
      telefono: '',
      email: '',
      activo: true
    });
    this.showClienteModal = true;
  }

  cerrarModalCliente() {
    this.showClienteModal = false;
    this.creandoCliente = false;
  }

  guardarCliente() {
    if (this.clienteForm.invalid || this.creandoCliente) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    this.creandoCliente = true;
    const payload = this.clienteForm.getRawValue() as any;
    this.clientesService.createCliente(payload).subscribe({
      next: (nuevo) => {
        const clienteId = Number((nuevo as any)?.id ?? (nuevo as any)?.id_cliente ?? 0);
        const cliente = {...nuevo, id: clienteId};
        this.clientes = [...this.clientes, cliente];
        this.form.get('cliente')?.setValue(cliente.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente creado',
          detail: 'Asignado al formulario.'
        });
        this.cerrarModalCliente();
      },
      error: () => {
        this.creandoCliente = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se creó el cliente',
          detail: 'Intentá nuevamente.'
        });
      }
    });
  }

  abrirModalProveedor() {
    this.proveedorForm.reset({
      nombre: '',
      tipo_proveedor: null,
      gremio: null,
      contacto: '',
      direccion: '',
      cuit: '',
      telefono: '',
      email: '',
      activo: true
    });
    this.showProveedorModal = true;
  }

  cerrarModalProveedor() {
    this.showProveedorModal = false;
    this.creandoProveedor = false;
  }

  guardarProveedor() {
    if (this.proveedorForm.invalid || this.creandoProveedor) {
      this.proveedorForm.markAllAsTouched();
      return;
    }
    this.creandoProveedor = true;
    const payload = this.proveedorForm.getRawValue() as any;
    this.proveedoresService.createProveedor(payload).subscribe({
      next: (nuevo) => {
        const proveedor = {...nuevo, id: Number((nuevo as any)?.id ?? 0)};
        this.proveedores = [...this.proveedores, proveedor];
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'Disponible en la matriz de costos.'
        });
        // Si hay filas de costo sin proveedor, asignar al último
        const ultimaFila = this.costos.controls[this.costos.length - 1] as FormGroup | undefined;
        if (ultimaFila && !ultimaFila.get('id_proveedor')?.value) {
          ultimaFila.get('id_proveedor')?.setValue(proveedor.id);
        }
        this.cerrarModalProveedor();
      },
      error: () => {
        this.creandoProveedor = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se creó el proveedor',
          detail: 'Intentá nuevamente.'
        });
      }
    });
  }
}
