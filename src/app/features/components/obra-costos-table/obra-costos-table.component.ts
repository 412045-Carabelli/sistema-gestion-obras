import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { ObraCosto } from '../../../core/models/models';

@Component({
  selector: 'app-obra-costos-table',
  standalone: true,
  templateUrl: './obra-costos-table.component.html',
  styleUrls: ['./obra-costos-table.component.css'],
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    CardModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    SelectModule,
    CurrencyPipe
  ]
})
export class ObraCostosTableComponent implements OnInit {
  @Input() costosFormArray!: FormArray<FormGroup>;
  @Input() presupuestoControl!: AbstractControl;
  @Input() costosIniciales: ObraCosto[] = []; // ✅ Costos iniciales desde el padre
  @Output() costosChange = new EventEmitter<number>();

  proveedores = [
    { id_proveedor: 1, nombre: 'Proveedor A' },
    { id_proveedor: 2, nombre: 'Proveedor B' },
    { id_proveedor: 3, nombre: 'Proveedor C' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // 📌 Inicializar el FormArray si está vacío
    if (!this.costosFormArray) {
      this.costosFormArray = this.fb.array<FormGroup>([]);
    }

    // 📌 Si hay costos iniciales, cargarlos en el form
    if (this.costosIniciales && this.costosIniciales.length > 0) {
      this.setCostos(this.costosIniciales);
    } else if (this.costosFormArray.length === 0) {
      this.nuevaFila();
    }

    // 📌 Escuchar cambios para recalcular presupuesto
    this.costosFormArray.valueChanges.subscribe(() => this.actualizarTotales());
  }

  private setCostos(costos: ObraCosto[]) {
    this.costosFormArray.clear();
    for (const c of costos) {
      this.costosFormArray.push(this.fb.group({
        id_proveedor: [c.id_proveedor ?? null],
        descripcion: [c.descripcion, Validators.required],
        unidad: [c.unidad ?? ''],
        cantidad: [c.cantidad, [Validators.required, Validators.min(0)]],
        precio_unitario: [c.precio_unitario, [Validators.required, Validators.min(0)]],
        subtotal: [{ value: c.subtotal ?? c.cantidad * c.precio_unitario, disabled: true }],
        total: [{ value: c.total ?? c.cantidad * c.precio_unitario, disabled: true }],
      }));
    }
    this.actualizarTotales();
  }

  nuevaFila() {
    const fila: FormGroup = this.fb.group({
      id_proveedor: [null],
      descripcion: ['', Validators.required],
      unidad: [''],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });

    this.costosFormArray.push(fila);
    this.actualizarTotales();
  }

  eliminarFila(index: number) {
    this.costosFormArray.removeAt(index);
    this.actualizarTotales();
  }

  private actualizarTotales() {
    let presupuestoTotal = 0;

    (this.costosFormArray.controls as FormGroup[]).forEach((group) => {
      const cantidad = Number(group.get('cantidad')?.value || 0);
      const precio = Number(group.get('precio_unitario')?.value || 0);

      const subtotal = cantidad * precio;
      const total = subtotal;

      group.get('subtotal')?.setValue(subtotal, { emitEvent: false });
      group.get('total')?.setValue(total, { emitEvent: false });

      presupuestoTotal += total;
    });

    if (this.presupuestoControl) {
      this.presupuestoControl.setValue(presupuestoTotal, { emitEvent: true });
    }

    this.costosChange.emit(presupuestoTotal);
  }
}
