import { Component, OnInit } from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ObraCostosTableComponent } from '../../components/obra-costos-table/obra-costos-table.component';

import { Cliente, EstadoObra, Proveedor } from '../../../core/models/models';
import { EstadoObraService } from '../../../services/estado-obra/estado-obra.service';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import {Checkbox} from 'primeng/checkbox';
import {DatePicker, DatePickerModule} from 'primeng/datepicker';
import {ObraPayload, ObrasService} from '../../../services/obras/obras.service';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-obras-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
    Select
  ],
  templateUrl: './obras-create.component.html',
  styleUrls: ['./obras-create.component.css'],
  providers: [DatePipe]
})
export class ObrasCreateComponent implements OnInit {
  form: FormGroup;
  clientes: Cliente[] = [];
  estadosObra: EstadoObra[] = [];
  proveedores: Proveedor[] = [];
  usarBeneficioGlobal = false;

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
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
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null],
      fecha_adjudicada: [null],
      fecha_perdida: [null],
      tiene_comision: [false],
      comision: new FormControl({ value: null, disabled: true }),
      presupuesto: new FormControl({ value: null, disabled: true }),
      beneficio_global: [false],
      beneficio: new FormControl({ value: null, disabled: true }),
      costos: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.clientesService.getClientes().subscribe(list =>
      this.clientes = list.map(c => ({ ...c, id: Number(c.id) }))
    );

    this.estadoObraService.getEstados().subscribe(list =>
      this.estadosObra = list.map(e => ({ ...e, id: Number(e.id) }))
    );

    this.proveedoresService.getProveedores().subscribe(list =>
      this.proveedores = list.map(p => ({ ...p, id_proveedor: Number(p.id) }))
    );

    this.form.get('obra_estado')?.valueChanges.subscribe(selected => {
      console.log('✅ Obra estado seleccionado:', selected);
      if (selected) {
        console.log('📌 ID:', selected.id);
        console.log('📌 Nombre:', selected.nombre);
      }
    });

    const beneficioCtrl = this.form.get('beneficio');
    const beneficioGlobalCtrl = this.form.get('beneficio_global');
    const comisionCtrl = this.form.get('comision');
    const comisionGlobalCtrl = this.form.get('tiene_comision');

    // ✅ Beneficio global
    beneficioGlobalCtrl?.valueChanges.subscribe((isGlobal: boolean) => {
      if (isGlobal) {
        beneficioCtrl?.enable({ emitEvent: false });
        this.costos.controls.forEach(fila => fila.get('beneficio')?.disable({ emitEvent: false }));
      } else {
        beneficioCtrl?.disable({ emitEvent: false });
        this.costos.controls.forEach(fila => fila.get('beneficio')?.enable({ emitEvent: false }));
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
        comisionCtrl?.enable({ emitEvent: false });
      } else {
        comisionCtrl?.disable({ emitEvent: false });
      }
      this.recalcularTotales();
    });

    comisionCtrl?.valueChanges.subscribe(() => {
      if (comisionGlobalCtrl?.value) {
        this.recalcularTotales();
      }
    });
  }

  private recalcularTotales() {
    this.costos.controls.forEach(fila => this.calcularSubtotal(fila as FormGroup));
  }

  get costos(): FormArray {
    return this.form.get('costos') as FormArray;
  }

  nuevaFilaCosto() {
    const fila = this.fb.group({
      id_proveedor: [null, Validators.required],
      descripcion: ['', Validators.required],
      unidad: [''],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      beneficio: [{ value: 0, disabled: this.form.get('beneficio_global')?.value }],
      subtotal: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
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

    const comisionGlobalActivo = this.form.get('comision')?.value;
    const comisionGlobalValor = Number(this.form.get('tiene_comision')?.value) || 0;

    let subtotal = cantidad * precio;
    let total = subtotal * (1 + beneficio / 100);

    if (comisionGlobalActivo) {
      total = total * (1 + comisionGlobalValor / 100);
    }

    fila.get('subtotal')?.setValue(subtotal, { emitEvent: false });
    fila.get('total')?.setValue(total, { emitEvent: false });

    this.actualizarPresupuesto();
  }


  actualizarPresupuesto() {
    const totalGeneral = this.costos.controls.reduce((acc, control) => {
      const t = control.get('total')?.value || 0;
      return acc + t;
    }, 0);
    this.form.get('presupuesto')?.setValue(totalGeneral);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: ObraPayload = {
      id_cliente: raw.cliente?.id ?? 0,
      obra_estado: raw.obra_estado,
      nombre: raw.nombre,
      direccion: raw.direccion,
      fecha_inicio: this.formatToLocalDateTime(raw.fecha_inicio),
      fecha_fin: this.formatToLocalDateTime(raw.fecha_fin),
      fecha_adjudicada: this.formatToLocalDateTime(raw.fecha_adjudicada),
      fecha_perdida: this.formatToLocalDateTime(raw.fecha_perdida),
      presupuesto: raw.presupuesto ?? 0,
      beneficio_global: raw.beneficio_global,
      beneficio: raw.beneficio ?? 0,
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

    console.log('📤 Payload FINAL enviado:', payload);

    this.obrasService.createObra(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Obra creada',
          detail: 'La obra se creó correctamente ✅',
          life: 3000
        });

        this.form.reset();
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

  private formatToLocalDateTime(value: Date | string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    return date.toISOString().replace('Z', '');
  }
}
