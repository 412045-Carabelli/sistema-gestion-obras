import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormArray, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CurrencyPipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Proveedor} from '../../../core/models/models';
import {ButtonModule} from 'primeng/button';
import {InputNumber} from 'primeng/inputnumber';

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
    ButtonModule,
    InputNumber
  ]
})
export class ObraCostosTableComponent implements OnInit, OnChanges {
  @Input({required: true}) costos!: FormArray<FormGroup>;
  @Input({required: true}) proveedores!: Proveedor[];
  @Input() modoEdicion = false;
  @Output() costoEliminado = new EventEmitter<void>();

  ngOnInit() {
    this.normalizarValoresProveedor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costos'] || changes['proveedores']) {
      this.normalizarValoresProveedor();
    }
  }

  getProveedorNombre(idProveedor: number | null): string {
    const id = (idProveedor as any)?.id ?? idProveedor;
    if (!id) return '';
    const proveedor = this.proveedores.find(p => p.id === id);
    return proveedor ? proveedor.nombre : '';
  }

  calcularTotalGeneral(): number {
    return this.costos.controls.reduce((acc, group) => {
      const total = group.get('total')?.value ?? 0;
      return acc + total;
    }, 0);
  }

  getItemNumeroDisplay(rowIndex: number): string {
    const fila = this.costos.at(rowIndex) as FormGroup;
    const itemNumero = (fila.get('item_numero')?.value ?? '').toString().trim();
    return itemNumero || String(rowIndex + 1);
  }

  eliminarFila(index: number) {
    if (index < 0 || index >= this.costos.length) return;
    this.costos.removeAt(index);
    this.costoEliminado.emit();
  }

  sortedProveedores(): Proveedor[] {
    return [...(this.proveedores || [])].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }

  private normalizarValoresProveedor() {
    if (!this.costos) return;
    this.costos.controls.forEach((group: FormGroup) => {
      const control = group.get('id_proveedor');
      const valor = control?.value;
      if (valor && typeof valor !== 'object') {
        const prov = this.proveedores.find(p => Number(p.id) === Number(valor));
        if (prov) {
          control?.setValue(prov, {emitEvent: false});
        }
      }
    });
  }
}
