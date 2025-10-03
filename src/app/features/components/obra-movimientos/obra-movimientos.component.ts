import { Component, Input } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TransaccionRotulada } from '../../../core/models/models';

@Component({
  selector: 'app-obra-movimientos',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, CurrencyPipe, DatePipe, TableModule, ButtonModule, TooltipModule],
  templateUrl: './obra-movimientos.component.html',
})
export class ObraMovimientosComponent {
  @Input() obraId!: number;

  // 🔹 Mock temporal (reemplazar con llamada API)
  transacciones: TransaccionRotulada[] = [
    { id_transaccion: 1, id_obra: 1, id_tipo_transaccion: 1, id_factura: 101, fecha: '2025-09-01', monto: 350000, parcial_o_total: 'total', activo: true, etiqueta: 'FC' },
    { id_transaccion: 2, id_obra: 1, id_tipo_transaccion: 2, id_recibo: 2001, fecha: '2025-09-05', monto: 120000, parcial_o_total: 'parcial', activo: true, etiqueta: 'RBOS' },
    { id_transaccion: 3, id_obra: 1, id_tipo_transaccion: 2, id_recibo: 2002, fecha: '2025-09-15', monto: 80000, parcial_o_total: 'total', activo: true, etiqueta: 'RBOS' }
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

  // 📌 Lugar para futuras llamadas a API
  nuevoMovimiento() {
    // Ejemplo: abrir modal / redirigir a formulario
    console.log('Nuevo movimiento');
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
