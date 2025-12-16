import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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
export class ObraCostosTableComponent implements OnInit, OnChanges {
  @Input({required: true}) costos!: FormArray<FormGroup>;
  @Input({required: true}) proveedores!: Proveedor[];
  @Input() modoEdicion = false;
  @Output() costoEliminado = new EventEmitter<void>();

  filteredProveedores: Proveedor[] = [];

  ngOnInit() {
    this.filteredProveedores = this.proveedores || [];
    this.normalizarValoresProveedor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['proveedores']) {
      this.filteredProveedores = this.proveedores || [];
    }

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

  eliminarFila(index: number) {
    if (index < 0 || index >= this.costos.length) return;
    this.costos.removeAt(index);
    this.costoEliminado.emit();
  }

  filtrarProveedores(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.filteredProveedores = (this.proveedores || []).filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const cuit = (p.cuit || '').toString().toLowerCase();
      return nombre.includes(query) || cuit.includes(query);
    });
  }

  seleccionarProveedor(rowIndex: number, value: any) {
    const seleccionado = typeof value === 'object' ? value : undefined;
    const fila = this.costos.at(rowIndex) as FormGroup;
    fila.get('id_proveedor')?.setValue(seleccionado ?? null);
  }

  limpiarProveedor(rowIndex: number) {
    const fila = this.costos.at(rowIndex) as FormGroup;
    fila.get('id_proveedor')?.setValue(null);
    this.filteredProveedores = this.proveedores || [];
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
