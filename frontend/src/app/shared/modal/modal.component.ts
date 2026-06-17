import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  @Input() visible: boolean = false;             // controlar si se ve
  @Input() title: string = 'Modal';              // título
  @Input() width: string = '500px';              // ancho por defecto
  @Input() closable: boolean = true;             // si se puede cerrar
  @Input() showFooter: boolean = true;           // mostrar botones por defecto
  @Input() contentStyle: any = {};               // estilos del contenido del dialog
  @Input() confirmLabel: string = 'Guardar';     // etiqueta del botón de acción
  @Input() confirmDisabled: boolean = false;     // deshabilitar botón de acción
  @Input() confirmLoading: boolean = false;      // loading en botón de acción

  @Output() closed = new EventEmitter<void>();   // evento al cerrar
  @Output() confirmed = new EventEmitter<void>(); // evento de confirmar

  close() {
    this.closed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }
}
