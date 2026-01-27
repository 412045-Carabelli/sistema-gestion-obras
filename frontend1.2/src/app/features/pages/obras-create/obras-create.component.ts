import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
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
import {AutoCompleteModule} from 'primeng/autocomplete';
import {RouterLink} from '@angular/router';
import {PreventInvalidSubmitDirective} from '../../../shared/directives/prevent-invalid-submit.directive';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {EditorModule} from 'primeng/editor';
import {ProveedorQuickModalComponent} from '../../components/proveedor-quick-modal/proveedor-quick-modal.component';

@Component({
  selector: 'app-obras-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    AutoCompleteModule,
    RouterLink
    , PreventInvalidSubmitDirective,
    ModalComponent,
    ProveedorQuickModalComponent,
    EditorModule
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
  filteredClientes: Cliente[] = [];
  private readonly NUEVO_TIPO_VALUE = '__nuevo_tipo__';
  private readonly NUEVO_GREMIO_VALUE = '__nuevo_gremio__';
  clienteForm: FormGroup;
  proveedorForm: Partial<Proveedor> = {};
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
      memoria_descriptiva: [''],
      requiere_factura: [false],
      tiene_comision: [false],
      comision: new FormControl({value: null, disabled: true}),
      presupuesto: new FormControl({value: null, disabled: true}),
      beneficio_global: [false],
      beneficio: new FormControl({value: null, disabled: true}),
      costos: this.fb.array([], Validators.minLength(1)),
    });

    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      cuit: ['', [Validators.required]],
      condicion_iva: [null, [Validators.required]],
      telefono: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]],
      activo: [true, Validators.required]
    });

    this.resetProveedorForm();
  }

  get costos(): FormArray {
    return this.form.get('costos') as FormArray;
  }

  ngOnInit() {
    this.clientesService.getClientes().subscribe(list =>
      {
        this.clientes = list.map(c => ({...c, id: Number(c.id)}));
        this.filteredClientes = this.clientes;
      }
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

    this.cargarCatalogosProveedor();

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
      item_numero: [''],
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
    if (this.costos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta matriz de costos',
        detail: 'Agrega al menos un costo para crear la obra.'
      });
      this.costos.markAsTouched();
      return;
    }
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
      memoria_descriptiva: raw.memoria_descriptiva?.trim() || undefined,
      requiere_factura: !!raw.requiere_factura,
      presupuesto: raw.presupuesto ?? 0,
      beneficio_global: raw.beneficio_global,
      beneficio: raw.beneficio ?? 0,
      tiene_comision: raw.tiene_comision || false,
      comision: raw.comision,
      costos: (raw.costos || []).map((c: any) => {
        const idProveedor =
          typeof c.id_proveedor === 'object'
            ? c.id_proveedor?.id
            : c.id_proveedor;
        const itemNumero = (c.item_numero ?? '').toString().trim();

        return {
          id_proveedor: idProveedor,
          item_numero: itemNumero || undefined,
          descripcion: c.descripcion,
          unidad: c.unidad,
          cantidad: c.cantidad,
          subtotal: c.total,
          precio_unitario: c.precio_unitario,
          beneficio: c.beneficio ?? 0,
          id_estado_pago: 1,
          tipo_costo: 'ORIGINAL'
        };
      }),
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

  recalcularTotales() {
    this.costos.controls.forEach(fila => this.calcularSubtotal(fila as FormGroup));
    this.actualizarPresupuesto();
  }

  filtrarClientes(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredClientes = this.clientes.filter(c => {
      const nombre = (c.nombre || '').toLowerCase();
      const cuit = (c.cuit || '').toString().toLowerCase();
      return nombre.includes(query) || cuit.includes(query);
    });
  }

  onClienteSeleccionado(cliente: Cliente | null) {
    this.form.get('cliente')?.setValue(cliente);
  }

  onClienteLimpiar() {
    this.form.get('cliente')?.setValue(null);
    this.filteredClientes = this.clientes;
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
        this.filteredClientes = this.clientes;
        this.form.get('cliente')?.setValue(cliente);
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
    this.resetProveedorForm();
    this.cargarCatalogosProveedor();
    this.showProveedorModal = true;
  }

  cerrarModalProveedor() {
    this.showProveedorModal = false;
    this.creandoProveedor = false;
  }

  private resetProveedorForm() {
    this.proveedorForm = {
      nombre: '',
      tipo_proveedor: '',
      gremio: '',
      direccion: '',
      contacto: '',
      cuit: '',
      telefono: '',
      email: '',
      activo: true
    };
  }

  guardarProveedor() {
    if (!this.proveedorForm.nombre || !this.proveedorForm.tipo_proveedor || !this.proveedorForm.contacto ||
      !this.proveedorForm.cuit || !this.proveedorForm.telefono) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa los datos obligatorios del proveedor.'
      });
      return;
    }
    if (this.creandoProveedor) {
      return;
    }
    this.creandoProveedor = true;
    const payload = this.proveedorForm as any;
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

  private cargarCatalogosProveedor() {
    this.proveedoresService.getTipos().subscribe({
      next: t => this.tiposProveedor = [
        ...t,
        {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
      ],
      error: () => this.tiposProveedor = [
        {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
      ]
    });
    this.proveedoresService.getGremios().subscribe({
      next: g => this.gremiosProveedor = [
        ...g,
        {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
      ],
      error: () => this.gremiosProveedor = [
        {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
      ]
    });
  }

  onTipoProveedorChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val === this.NUEVO_TIPO_VALUE) {
      const nombre = prompt('Nombre del nuevo tipo de proveedor:');
      if (!nombre) {
        this.proveedorForm.tipo_proveedor = undefined;
        return;
      }
      this.proveedoresService.crearTipo(nombre).subscribe({
        next: t => {
          this.tiposProveedor = [
            ...this.tiposProveedor.filter(op => op.name !== this.NUEVO_TIPO_VALUE),
            t,
            {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
          ];
          this.proveedorForm.tipo_proveedor = t.name ?? t.label ?? t;
        },
        error: () => {
          alert('No se pudo crear el tipo');
          this.proveedorForm.tipo_proveedor = undefined;
        }
      });
    } else if (val) {
      this.proveedorForm.tipo_proveedor = val;
    }
  }

  onGremioChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val === this.NUEVO_GREMIO_VALUE) {
      const nombre = prompt('Nombre del nuevo gremio:');
      if (!nombre) {
        this.proveedorForm.gremio = undefined;
        return;
      }
      this.proveedoresService.crearGremio(nombre).subscribe({
        next: g => {
          this.gremiosProveedor = [
            ...this.gremiosProveedor.filter(op => op.name !== this.NUEVO_GREMIO_VALUE),
            g,
            {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
          ];
          this.proveedorForm.gremio = g.name ?? g.label ?? g;
        },
        error: () => {
          alert('No se pudo crear el gremio');
          this.proveedorForm.gremio = undefined;
        }
      });
    } else if (val) {
      this.proveedorForm.gremio = val;
    }
  }
}



