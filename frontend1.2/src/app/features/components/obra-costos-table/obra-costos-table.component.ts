import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormArray, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CurrencyPipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Proveedor} from '../../../core/models/models';
import {AutoComplete} from 'primeng/autocomplete';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-obra-costos-table',
  standalone: true,
  templateUrl: './obra-costos-table.component.html',
  imports: [
    CurrencyPipe,
    TableModule,
    ReactiveFormsModule,
    Select,
    InputText,
    AutoComplete,
    ButtonModule
  ]
})
export class ObraCostosTableComponent {
  @Input({required: true}) costos!: FormArray<FormGroup>;
  @Input({required: true}) proveedores!: Proveedor[];
  @Input() modoEdicion = false;
  @Output() costoEliminado = new EventEmitter<void>();


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

  eliminarFila(index: number) {
    if (index < 0 || index >= this.costos.length) return;
    this.costos.removeAt(index);
    this.costoEliminado.emit();
  }
}
