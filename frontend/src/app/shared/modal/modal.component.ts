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

  /**
   * Modo "ver detalle": reemplaza el footer estándar (Cancelar/Guardar) por
   * Cerrar/Editar (+ Eliminar opcional a la izquierda), siempre en el mismo
   * footer fijo del diálogo — así "ver" y "editar" usan exactamente el mismo
   * layout, sin que el contenido crezca ni mueva los botones de lugar.
   */
  @Input() viewMode: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() deleteLabel: string = 'Eliminar';
  @Input() deleteLoading: boolean = false;
  @Input() editLabel: string = 'Editar';

  @Output() closed = new EventEmitter<void>();   // evento al cerrar
  @Output() confirmed = new EventEmitter<void>(); // evento de confirmar
  @Output() deleted = new EventEmitter<void>();   // evento de eliminar (viewMode)
  @Output() edit = new EventEmitter<void>();      // evento de pasar a edición (viewMode)

  close() {
    this.closed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }
}
