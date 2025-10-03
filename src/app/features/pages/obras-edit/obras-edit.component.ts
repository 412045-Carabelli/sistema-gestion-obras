import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, NgIf } from '@angular/common';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import {Cliente, Obra, ObraCosto} from '../../../core/models/models';
import { ObraCostosTableComponent } from '../../components/obra-costos-table/obra-costos-table.component';
import {Calendar} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {Tooltip} from 'primeng/tooltip';

@Component({
  selector: 'app-obras-edit',
  standalone: true,
  templateUrl: './obras-edit.component.html',
  styleUrls: ['./obras-edit.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TabsModule,
    ObraCostosTableComponent,
    Calendar,
    DropdownModule,
    Tooltip,
  ],
})
export class ObrasEditComponent implements OnInit {
  @Input() obra: Obra = {
    id_obra: 1,
    nombre: 'Casa Familia Rodriguez',
    direccion: 'Av. San Martín 1234, Córdoba',
    id_cliente: 1,
    id_estado_obra: 1,
    fecha_inicio: '2024-03-01',
    fecha_fin: '2024-12-15',
    fecha_adjudicada: '2024-02-15',
    fecha_perdida: undefined,
    presupuesto: 850000,
    gastado: 638000,
    activo: true,
  };
  costosMock: ObraCosto[] = [
    {
      id_obra_costo: 1,
      id_obra: 1,
      id_proveedor: 1,
      descripcion: 'Cemento Portland',
      unidad: 'bolsas',
      cantidad: 100,
      precio_unitario: 2500,
      subtotal: 250000,
      total: 302500,
      activo: true
    },
    {
      id_obra_costo: 2,
      id_obra: 1,
      id_proveedor: 2,
      descripcion: 'Arena gruesa',
      unidad: 'm³',
      cantidad: 20,
      precio_unitario: 15000,
      subtotal: 300000,
      total: 363000,
      activo: true
    }
  ];


  clientes: Cliente[] = [];
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.clientes = [
      { id_cliente: 1, nombre: 'Rodriguez S.A.' },
      { id_cliente: 2, nombre: 'Constructora B' },
      { id_cliente: 3, nombre: 'Cliente Interno' }
    ];

    this.form = this.fb.group({
      id_cliente: [this.obra.id_cliente, Validators.required],
      nombre: [this.obra.nombre, [Validators.required, Validators.minLength(3)]],
      direccion: [this.obra.direccion, [Validators.required, Validators.minLength(5)]],
      fecha_inicio: [this.parseDate(this.obra.fecha_inicio), Validators.required],
      fecha_fin: [this.parseDate(this.obra.fecha_fin)],
      fecha_adjudicada: [this.parseDate(this.obra.fecha_adjudicada)],
      fecha_perdida: [this.parseDate(this.obra.fecha_perdida)],
      presupuesto: [{ value: this.obra.presupuesto, disabled: true }, Validators.required],
      costos: this.fb.array(this.costosMock),
    });

    // 📌 Cargar costos y proveedores desde la API (futuro)
    // this.apiService.getObraCostos(this.obra.id_obra).subscribe(costos => this.setCostos(costos));
  }

  get costos(): FormArray {
    return this.form.get('costos') as FormArray;
  }

  parseDate(value: string | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  formatDate(date: Date | null): string | null {
    return date ? new DatePipe('en-GB').transform(date, 'yyyy-MM-dd') : null;
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = {
        ...this.form.getRawValue(),
        fecha_inicio: this.formatDate(this.form.value.fecha_inicio),
        fecha_fin: this.formatDate(this.form.value.fecha_fin),
        fecha_adjudicada: this.formatDate(this.form.value.fecha_adjudicada),
        fecha_perdida: this.formatDate(this.form.value.fecha_perdida),
      };

      console.log('✅ Datos listos para enviar:', formValue);

      // 📌 Integración API futura
      // this.apiService.updateObra(this.obra.id_obra, formValue).subscribe(() => {
      //   this.toastService.success('Obra actualizada correctamente');
      // });
    } else {
      this.form.markAllAsTouched();
    }
  }

  nuevaFilaCosto() {
    const fila = this.fb.group({
      id_proveedor: [null],
      descripcion: ['', Validators.required],
      unidad: [''],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });

    this.costos.push(fila);
  }
}
