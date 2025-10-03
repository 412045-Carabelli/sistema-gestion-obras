import { Component, Input } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {Tarea, Transaccion, TransaccionRotulada} from '../../../core/models/models';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {InputNumber} from 'primeng/inputnumber';
import {DatePicker} from 'primeng/datepicker';

@Component({
  selector: 'app-obra-movimientos',
  standalone: true,
  imports: [NgClass, CurrencyPipe, DatePipe, TableModule, ButtonModule, TooltipModule, DropdownModule, FormsModule, InputText, ModalComponent, InputNumber, DatePicker],
  templateUrl: './obra-movimientos.component.html',
})
export class ObraMovimientosComponent {
  @Input() obraId!: number;

  parcial_o_total_options = [
    { label: 'Parcial', value: 'parcial' },
    { label: 'Total', value: 'total' }
  ];

  // 🔹 Mock temporal (reemplazar con llamada API)
  transacciones: TransaccionRotulada[] = [
    { id_transaccion: 1, id_obra: 1, id_tipo_transaccion: 1, id_factura: 101, fecha: '2025-09-01', monto: 350000, parcial_o_total: 'total', activo: true, etiqueta: 'FC' },
    { id_transaccion: 2, id_obra: 1, id_tipo_transaccion: 2, id_recibo: 2001, fecha: '2025-09-05', monto: 120000, parcial_o_total: 'parcial', activo: true, etiqueta: 'RBOS' },
    { id_transaccion: 3, id_obra: 1, id_tipo_transaccion: 2, id_recibo: 2002, fecha: '2025-09-15', monto: 80000, parcial_o_total: 'total', activo: true, etiqueta: 'RBOS' }
  ];

  tiposTransaccion = [
    { id_tipo_transaccion: 1, nombre: 'Cobro', etiqueta: 'FC' },
    { id_tipo_transaccion: 2, nombre: 'Pago', etiqueta: 'RBOS' }
  ];

  get totalCobros(): number {
    return this.transacciones
      .filter(t => t.etiqueta === 'FC')
      .reduce((acc, t) => acc + t.monto, 0);
  }

  get totalPagos(): number {
    return this.transacciones
      .filter(t => t.etiqueta === 'RBOS')
      .reduce((acc, t) => acc + t.monto, 0);
  }

  get saldo(): number {
    return this.totalCobros - this.totalPagos;
  }

  showAddMovementModal = false;
  nuevoMovimiento: Transaccion = {
    id_tipo_transaccion: 1,
    fecha: new Date().toISOString().split('T')[0],
    id_obra: this.obraId,
    monto: 0,
    parcial_o_total: 'total'
  };

  openModal() {
    this.showAddMovementModal = true;
  }

  cerrarModal() {
    this.showAddMovementModal = false;
  }

  verPDF(t: TransaccionRotulada) {
    // TODO: Llamar API para obtener PDF
    console.log('Ver PDF de', t);
  }

  eliminarMovimiento(t: TransaccionRotulada) {
    // TODO: Llamar API para eliminar
    console.log('Eliminar', t);
    this.transacciones = this.transacciones.filter(x => x.id_transaccion !== t.id_transaccion);
  }
}
