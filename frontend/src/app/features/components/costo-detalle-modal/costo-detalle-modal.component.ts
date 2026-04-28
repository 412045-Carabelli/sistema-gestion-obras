import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { ObraCosto } from '../../../core/models/models';

@Component({
  selector: 'app-costo-detalle-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, InputNumber, FormsModule, CurrencyPipe],
  templateUrl: './costo-detalle-modal.component.html',
  styleUrls: ['./costo-detalle-modal.component.css']
})
export class CostoDetalleModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() costo: ObraCosto | null = null;
  @Input() modoEdicion = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardar = new EventEmitter<ObraCosto>();

  costoEditando: ObraCosto | null = null;

  ngOnInit() {
    this.inicializarEdicion();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costo'] || changes['visible']) {
      this.inicializarEdicion();
    }
  }

  private inicializarEdicion() {
    if (this.costo) {
      this.costoEditando = { ...this.costo };
    }
  }

  calcularDesvio(): number {
    if (!this.costoEditando) return 0;
    const base = this.costoEditando.subtotal ?? 0;
    const real = this.costoEditando.monto_real ?? 0;
    return base - real;
  }

  guardarCambios() {
    if (this.costoEditando) {
      this.guardar.emit(this.costoEditando);
      this.cerrar();
    }
  }

  cerrar() {
    this.visibleChange.emit(false);
  }
}
