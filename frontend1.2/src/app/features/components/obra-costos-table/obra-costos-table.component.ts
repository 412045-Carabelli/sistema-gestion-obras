import {Component, Input} from '@angular/core';
import {FormArray, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CurrencyPipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Proveedor} from '../../../core/models/models';

@Component({
  selector: 'app-obra-costos-table',
  standalone: true,
  templateUrl: './obra-costos-table.component.html',
  imports: [
    CurrencyPipe,
    TableModule,
    ReactiveFormsModule,
    Select,
    InputText
  ]
})
export class ObraCostosTableComponent {
  @Input({required: true}) costos!: FormArray<FormGroup>;
  @Input({required: true}) proveedores!: Proveedor[];
  @Input() modoEdicion = false;

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
