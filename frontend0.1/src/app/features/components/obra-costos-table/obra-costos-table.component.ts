import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CurrencyPipe, DecimalPipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {Proveedor} from '../../../core/models/models';
import {InputText} from 'primeng/inputtext';

@Component({
  selector: 'app-obra-costos-table',
  templateUrl: './obra-costos-table.component.html',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TableModule,
    ReactiveFormsModule,
    Button,
    Select,
    InputText
  ]
})
export class ObraCostosTableComponent implements OnInit {
  @Input({ required: true }) costos!: FormArray<FormGroup>;
  @Input() proveedores: Proveedor[] = [];
  @Input() modoEdicion = false;
  @Output() agregarFila = new EventEmitter<void>();

  ngOnInit(): void {
    console.log(this.modoEdicion);
  }

  getProveedorNombre(idProveedor: number | null): string {
    if (!idProveedor) return '—';
    const proveedor = this.proveedores.find(p => p.id === idProveedor);
    return proveedor ? proveedor.nombre : '—';
  }


  calcularTotalGeneral(): number {
    return this.costos.controls.reduce((acc, group) => {
      const total = group.get('total')?.value ?? 0;
      return acc + total;
    }, 0);
  }
}
