import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="false"
      [style]="{ width: '400px' }"
      [draggable]="false"
      [resizable]="false"
    >
      <ng-template pTemplate="header">
        <h2 class="text-lg font-semibold text-gray-800">{{ title }}</h2>
      </ng-template>

      <div class="py-4 text-gray-700">
        {{ message }}
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            [label]="cancelLabel || 'Cancelar'"
            styleClass="p-button-text"
            (onClick)="handleCancel()"
          ></p-button>
          <p-button
            [label]="confirmLabel || 'Confirmar'"
            styleClass="p-button-danger"
            (onClick)="handleConfirm()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  imports: [DialogModule, ButtonModule],
})
export class ModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de que quieres continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  handleConfirm() {
    this.onConfirm.emit();
    this.visible = false;
  }

  handleCancel() {
    this.onCancel.emit();
    this.visible = false;
  }
}
