import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {forkJoin} from 'rxjs';

import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {TabsModule} from 'primeng/tabs';
import {DropdownModule} from 'primeng/dropdown';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {Checkbox} from 'primeng/checkbox';

import {Cliente, EstadoObra, Obra, ObraCosto, Proveedor} from '../../../core/models/models';
import {ObraCostosTableComponent} from '../../components/obra-costos-table/obra-costos-table.component';
import {ObraPayload, ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';
import {CatalogoOption, ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {EditorModule} from 'primeng/editor';

@Component({
  selector: 'app-obras-edit',
  standalone: true,
  templateUrl: './obras-edit.component.html',
  styleUrls: ['./obras-edit.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TabsModule,
    ObraCostosTableComponent,
    DropdownModule,
    ProgressSpinnerModule,
    ToastModule,
    Checkbox,
    RouterLink,
    ModalComponent,
    EditorModule,
  ],
  providers: [MessageService],
})
export class ObrasEditComponent implements OnInit {
  @Input() obra!: Obra;

  clientes: Cliente[] = [];
  estadosRecords: { label: string; name: string }[] = [];
  proveedores: Proveedor[] = [];
  tiposProveedor: CatalogoOption[] = [];
  gremiosProveedor: CatalogoOption[] = [];
  ivaOptions: {label: string; name: string}[] = [];
  clienteForm!: FormGroup;
  proveedorForm!: FormGroup;
  creandoCliente = false;
  creandoProveedor = false;
  showClienteModal = false;
  showProveedorModal = false;
  form!: FormGroup;
  loading = true;
  private obraId: number | null = null;
  private initialSnapshot = '';
  tieneCambios = false;

  constructor(
    private fb: FormBuilder,
    private obrasService: ObrasService,
    private clienteService: ClientesService,
    private proveedoresService: ProveedoresService,
    private estadoObraService: EstadoObraService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
  }

  get costos(): FormArray<FormGroup> {
    return this.form.get('costos') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.inicializarFormulariosRapidos();
    this.obraId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.obraId) this.cargarDatosIniciales(this.obraId);
    this.cargarCatalogosRapidos();
  }

  parseDate(value?: string): Date | null {
    return value ? new Date(value) : null;
  }

  formatDate(date: Date | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString().slice(0, 19);
  }

  private resolveEstadoValue(rawEstado: any): string | null {
    if (!rawEstado) return null;
    if (typeof rawEstado === 'string') return rawEstado;
    return rawEstado.name ?? rawEstado.label ?? null;
  }

  private resolveClienteId(cliente: any, fallbackId?: number | null): number | null {
    if (cliente == null && fallbackId == null) return null;
    if (typeof cliente === 'number') return cliente;
    return cliente?.id ?? fallbackId ?? null;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const clienteId = this.resolveClienteId(raw.cliente, this.obra.id_cliente);
    const estadoValue = this.resolveEstadoValue(raw.obra_estado);

    const payload: ObraPayload = {
      id: this.obraId!,
      id_cliente: clienteId as number,
      obra_estado: estadoValue as any,
      nombre: raw.nombre,
      direccion: raw.direccion,
      fecha_inicio: this.formatDate(this.form.value.fecha_inicio)!,
      fecha_fin: this.formatDate(this.form.value.fecha_fin),
      fecha_adjudicada: this.formatDate(this.form.value.fecha_adjudicada),
      fecha_perdida: this.formatDate(this.form.value.fecha_perdida),
      tiene_comision: raw.tiene_comision,
      presupuesto: raw.presupuesto,
      comision: raw.comision,
      beneficio: raw.beneficio,
      notas: raw.notas,
      memoria_descriptiva: raw.memoria_descriptiva,
      requiere_factura: !!raw.requiere_factura,
      condiciones_presupuesto: this.obra.condiciones_presupuesto,
      observaciones_presupuesto: this.obra.observaciones_presupuesto,
      beneficio_global: raw.beneficio_global,
      tareas: [],
      costos: raw.costos.map((c: any) => {
        const itemNumero = (c.item_numero ?? '').toString().trim();
        return {
          ...c,
          item_numero: itemNumero || undefined,
          id_proveedor: c.proveedor?.id ?? null,
          proveedor: undefined // eliminamos el objeto proveedor para no romper el contrato
        };
      })
    };

    // 🧼 limpiar undefined
    Object.keys(payload).forEach(
      key => (payload as any)[key] === undefined && delete (payload as any)[key]
    );

    this.loading = true;

    this.obrasService.updateObra(this.obra.id!, payload).subscribe({
      next: () => {
        this.loading = false;
        this.initialSnapshot = this.snapshotForm();
        this.tieneCambios = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Obra actualizada',
          detail: 'Los cambios se guardaron correctamente.',
          life: 3000,
        });
        setTimeout(() => this.router.navigate(['/obras', this.obra.id!]), 1200);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: 'No se pudo actualizar la obra.',
          life: 3000,
        });
      },
    });
  }

  private cargarDatosIniciales(idObra: number) {
    this.loading = true;
    forkJoin({
      clientes: this.clienteService.getClientes(),
      estados: this.estadoObraService.getEstados(),
      proveedores: this.proveedoresService.getProveedores(),
      obra: this.obrasService.getObraById(idObra),
    }).subscribe({
      next: ({clientes, estados, proveedores, obra}) => {
        this.clientes = clientes.map(c => ({...c, id: Number(c.id)}));
        this.estadosRecords = this.ordenarEstadosObra(estados as any);
        this.proveedores = proveedores;
        this.obra = {...obra, costos: obra.costos ?? []} as Obra;
        this.inicializarFormulario();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar datos',
          detail: 'No se pudieron cargar los datos de la obra.',
          life: 3000,
        });
      },
    });
  }

  private cargarCatalogosRapidos() {
    this.clienteService.getCondicionesIva().subscribe({
      next: data => this.ivaOptions = data,
      error: () => this.ivaOptions = [],
    });

    forkJoin({
      tipos: this.proveedoresService.getTipos(),
      gremios: this.proveedoresService.getGremios(),
    }).subscribe({
      next: ({tipos, gremios}) => {
        this.tiposProveedor = tipos;
        this.gremiosProveedor = gremios;
      },
      error: () => {
        this.tiposProveedor = [];
        this.gremiosProveedor = [];
      }
    });
  }

  private inicializarFormulario() {
    const currentEstado = this.resolveEstadoValue(this.obra.obra_estado);
    const currentCliente = this.resolveClienteId(this.obra.cliente, this.obra.id_cliente);

    this.form = this.fb.group({
      cliente: [currentCliente, Validators.required],
      obra_estado: [currentEstado, Validators.required],
      nombre: [this.obra.nombre, [Validators.required, Validators.minLength(3)]],
      direccion: [this.obra.direccion, [Validators.required, Validators.minLength(5)]],
      fecha_inicio: [this.parseDate(this.obra.fecha_inicio), Validators.required],
      beneficio_global: [this.obra.beneficio_global],
      beneficio: [this.obra.beneficio, [Validators.required]],
      fecha_fin: [this.parseDate(this.obra.fecha_fin)],
      fecha_adjudicada: [this.parseDate(this.obra.fecha_adjudicada)],
      fecha_perdida: [this.parseDate(this.obra.fecha_perdida)],
      presupuesto: [{value: this.obra.presupuesto, disabled: true}, Validators.required],
      notas: [this.obra.notas ?? ""],
      memoria_descriptiva: [this.obra.memoria_descriptiva ?? ""],
      requiere_factura: [this.obra.requiere_factura ?? false],
      tiene_comision: [this.obra.tiene_comision ?? false],
      comision: [this.obra.comision ?? 0, [Validators.min(0), Validators.max(100)]],
      costos: this.fb.array<FormGroup>([])
    });

    this.cargarCostosEnFormArray(this.obra.costos ?? []);
    this.form.get('costos')?.disable({emitEvent: false});
    this.syncControlesFinancieros();
    this.registrarSnapshotInicial();
  }

  private registrarSnapshotInicial() {
    this.initialSnapshot = this.snapshotForm();
    this.tieneCambios = false;
    this.form.markAsPristine();
    this.form.valueChanges.subscribe(() => this.evaluarCambios());
  }

  private evaluarCambios() {
    const snapshot = this.snapshotForm();
    this.tieneCambios = snapshot !== this.initialSnapshot;
    console.log('[ObrasEdit] tieneCambios:', this.tieneCambios, 'form.invalid:', this.form.invalid, {
      invalidControls: Object.keys(this.form.controls).filter(k => this.form.controls[k].invalid)
    });
  }

  private snapshotForm(): string {
    const raw = this.form.getRawValue();
    // normalizar costos para evitar cambios por orden de propiedades
    const costos = (raw.costos || []).map((c: any) => ({
      id: c.id ?? null,
      id_obra: c.id_obra ?? null,
      item_numero: c.item_numero ?? '',
      descripcion: c.descripcion ?? '',
      unidad: c.unidad ?? '',
      cantidad: c.cantidad ?? 0,
      precio_unitario: c.precio_unitario ?? 0,
      beneficio: c.beneficio ?? 0,
      id_proveedor: c.id_proveedor ?? (c.proveedor?.id ?? null),
      estado_pago: c.estado_pago ?? null,
      activo: c.activo ?? true
    }));
    const snapshot = {
      ...raw,
      cliente: this.resolveClienteId(raw.cliente, this.obra.id_cliente),
      obra_estado: this.resolveEstadoValue(raw.obra_estado),
      costos
    };
    return JSON.stringify(snapshot);
  }

  private syncControlesFinancieros() {
    const beneficioGlobalCtrl = this.form.get('beneficio_global');
    const beneficioCtrl = this.form.get('beneficio');
    const comisionCtrl = this.form.get('comision');
    const comisionGlobalCtrl = this.form.get('tiene_comision');

    if (!beneficioGlobalCtrl?.value) {
      beneficioCtrl?.disable({emitEvent: false});
    } else {
      beneficioCtrl?.enable({emitEvent: false});
    }
    if (!comisionGlobalCtrl?.value) {
      comisionCtrl?.disable({emitEvent: false});
    } else {
      comisionCtrl?.enable({emitEvent: false});
    }
    if (beneficioCtrl?.value == null) {
      beneficioCtrl?.setValue(0, {emitEvent: false});
    }
    if (comisionCtrl?.value == null) {
      comisionCtrl?.setValue(0, {emitEvent: false});
    }

    beneficioGlobalCtrl?.valueChanges.subscribe((isGlobal: boolean) => {
      if (isGlobal) {
        beneficioCtrl?.enable({emitEvent: false});
      } else {
        beneficioCtrl?.disable({emitEvent: false});
      }
    });

    comisionGlobalCtrl?.valueChanges.subscribe((isGlobal: boolean) => {
      if (isGlobal) {
        comisionCtrl?.enable({emitEvent: false});
      } else {
        comisionCtrl?.disable({emitEvent: false});
      }
    });
  }

  private inicializarFormulariosRapidos() {
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      contacto: ['', Validators.required],
      cuit: ['', Validators.required],
      condicion_iva: [null, Validators.required],
      telefono: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]],
      activo: [true, Validators.required],
    });

    this.proveedorForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo_proveedor: [null, Validators.required],
      gremio: [null],
      contacto: ['', Validators.required],
      direccion: [''],
      cuit: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.email]],
      activo: [true, Validators.required],
    });
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
    this.clienteService.createCliente(payload).subscribe({
      next: (nuevo) => {
        const clienteId = Number((nuevo as any)?.id ?? (nuevo as any)?.id_cliente ?? 0);
        const cliente = {...nuevo, id: clienteId};
        this.clientes = [...this.clientes, cliente];
        this.form.get('cliente')?.setValue(cliente.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente creado',
          detail: 'Ya podés asignarlo a la obra.'
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
        const proveedor = {...nuevo, id: Number((nuevo as any).id ?? 0)};
        this.proveedores = [...this.proveedores, proveedor];
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'Disponible en la lista de costos.'
        });
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

  private cargarCostosEnFormArray(costos: ObraCosto[]) {
    const costosArray = this.form.get('costos') as FormArray<FormGroup>;
    costosArray.clear();
    costos.forEach((costo) => {
      const proveedorRef =
        costo.proveedor ??
        this.proveedores.find(p => Number(p.id) === Number(costo.id_proveedor));
      costosArray.push(
        this.fb.group({
          id: [costo.id],
          id_obra: [costo.id_obra],
          item_numero: [costo.item_numero ?? ''],
          descripcion: [costo.descripcion, Validators.required],
          unidad: [costo.unidad],
          cantidad: [costo.cantidad, [Validators.required, Validators.min(0)]],
          precio_unitario: [costo.precio_unitario, [Validators.required, Validators.min(0)]],
          beneficio: [costo.beneficio ?? 0],
          proveedor: [proveedorRef ?? null, Validators.required],
          id_proveedor: [costo.id_proveedor ?? proveedorRef?.id ?? null, Validators.required],
          estado_pago: [costo.estado_pago ?? null],
          activo: [costo.activo ?? true],
          total: [{value: costo.total ?? (costo.cantidad * costo.precio_unitario) ?? 0, disabled: true}],
        })
      );
    });
  }

  private ordenarEstadosObra(records: { label: string; name: string }[]): { label: string; name: string }[] {
    const ordenDeseado = [
      'PRESUPUESTADA',
      'COTIZADA',
      'PERDIDA',
      'ADJUDICADA',
      'EN_PROGRESO',
      'FINALIZADA',
      'FACTURADA'
    ];
    const index = new Map(ordenDeseado.map((estado, i) => [estado, i]));
    const normalizar = (value?: string | null) =>
      (value || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

    return [...(records || [])].sort((a, b) => {
      const aKey = index.get(normalizar(a?.name || a?.label)) ?? 999;
      const bKey = index.get(normalizar(b?.name || b?.label)) ?? 999;
      if (aKey !== bKey) return aKey - bKey;
      return (a?.label || '').localeCompare(b?.label || '');
    });
  }
}
