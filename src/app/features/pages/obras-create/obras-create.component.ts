import {Component, OnInit} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ObraCostosTableComponent } from '../../components/obra-costos-table/obra-costos-table.component';
import {Cliente} from '../../../core/models/models';

@Component({
  selector: 'app-obras-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    TooltipModule,
    ObraCostosTableComponent
  ],
  templateUrl: './obras-create.component.html',
  styleUrls: ['./obras-create.component.css'],
  providers: [DatePipe]
})
export class ObrasCreateComponent implements OnInit{
  form: FormGroup;
  clientes: Cliente[] = [];

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.form = this.fb.group({
      id_cliente: [null, Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null],
      fecha_adjudicada: [null],
      fecha_perdida: [null],
      presupuesto: [{ value: null, disabled: true }, [Validators.required]],
      costos: this.fb.array([])
    });
  }

  ngOnInit() {
    this.clientes = [
      { id_cliente: 1, nombre: 'Rodriguez S.A.' },
      { id_cliente: 2, nombre: 'Constructora B' },
      { id_cliente: 3, nombre: 'Cliente Interno' }
    ];
  }

  get costos(): FormArray {
    return this.form.get('costos') as FormArray;
  }

  onSubmit() {
    if (this.form.valid) {
      // 📌 Transformar fechas a 'yyyy-MM-dd' antes de enviar a la API
      const raw = this.form.getRawValue();

      const payload = {
        ...raw,
        fecha_inicio: this.formatDate(raw.fecha_inicio),
        fecha_fin: this.formatDate(raw.fecha_fin),
        fecha_adjudicada: this.formatDate(raw.fecha_adjudicada),
        fecha_perdida: this.formatDate(raw.fecha_perdida),
      };

      console.log('Payload listo para API:', payload);

      // 📌 Aquí iría la llamada real a la API
      // this.obraService.createObra(payload).subscribe(...)
    } else {
      this.form.markAllAsTouched();
    }
  }

  private formatDate(value: Date | string | null): string | null {
    if (!value) return null;
    return this.datePipe.transform(value, 'yyyy-MM-dd');
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
