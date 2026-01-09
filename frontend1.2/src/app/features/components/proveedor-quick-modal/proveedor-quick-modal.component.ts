import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {CatalogoOption} from '../../../services/proveedores/proveedores.service';
import {Proveedor} from '../../../core/models/models';

@Component({
  selector: 'app-proveedor-quick-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Select, InputText, ModalComponent],
  templateUrl: './proveedor-quick-modal.component.html'
})
export class ProveedorQuickModalComponent {
  @Input() visible = false;
  @Input() title = 'Nuevo proveedor';
  @Input() tiposProveedor: CatalogoOption[] = [];
  @Input() gremiosProveedor: CatalogoOption[] = [];
  @Input() model: Partial<Proveedor> = {};

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() tipoChange = new EventEmitter<CatalogoOption | string | null>();
  @Output() gremioChange = new EventEmitter<CatalogoOption | string | null>();

  onTipoChange(value: CatalogoOption | string | null) {
    this.tipoChange.emit(value);
  }

  onGremioChange(value: CatalogoOption | string | null) {
    this.gremioChange.emit(value);
  }
}
