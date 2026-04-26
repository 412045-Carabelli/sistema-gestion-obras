import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {MessageService} from 'primeng/api';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {Proveedor} from '../../../core/models/models';
import {CatalogoOption, ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {ProveedorQuickModalComponent} from '../proveedor-quick-modal/proveedor-quick-modal.component';

@Component({
  selector: 'app-proveedor-quick-create',
  standalone: true,
  imports: [CommonModule, FormsModule, InputText, ModalComponent, ProveedorQuickModalComponent],
  templateUrl: './proveedor-quick-create.component.html'
})
export class ProveedorQuickCreateComponent implements OnChanges {
  @Input() visible = false;
  @Input() title = 'Nuevo proveedor';

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<Proveedor>();

  proveedorForm: Partial<Proveedor> = {};
  tiposProveedor: CatalogoOption[] = [];
  gremiosProveedor: CatalogoOption[] = [];

  showTipoProveedorModal = false;
  showGremioProveedorModal = false;
  nuevoTipoProveedorNombre = '';
  nuevoGremioProveedorNombre = '';
  creandoProveedor = false;
  creandoTipoProveedor = false;
  creandoGremioProveedor = false;

  private readonly NUEVO_TIPO_VALUE = '__nuevo_tipo__';
  private readonly NUEVO_GREMIO_VALUE = '__nuevo_gremio__';

  constructor(
    private proveedoresService: ProveedoresService,
    private messageService: MessageService
  ) {
    this.resetProveedorForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.resetProveedorForm();
      this.cargarCatalogosProveedor();
    }
  }

  cerrarModalProveedor() {
    this.creandoProveedor = false;
    this.closed.emit();
  }

  guardarProveedor() {
    if (!this.proveedorForm.nombre || !this.proveedorForm.tipo_proveedor || !this.proveedorForm.contacto ||
      !this.proveedorForm.cuit || !this.proveedorForm.telefono) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa los datos obligatorios del proveedor.'
      });
      return;
    }
    if (this.creandoProveedor) return;
    this.creandoProveedor = true;
    const payload = this.proveedorForm as any;
    this.proveedoresService.createProveedor(payload).subscribe({
      next: (nuevo) => {
        const proveedor = {...nuevo, id: Number((nuevo as any)?.id ?? 0)};
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'Disponible para seleccionar.'
        });
        this.creandoProveedor = false;
        this.created.emit(proveedor as Proveedor);
        this.closed.emit();
      },
      error: () => {
        this.creandoProveedor = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se creo el proveedor',
          detail: 'Intenta nuevamente.'
        });
      }
    });
  }

  onTipoProveedorChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val === this.NUEVO_TIPO_VALUE) {
      this.abrirModalTipoProveedor();
    } else if (val) {
      this.proveedorForm.tipo_proveedor = val;
    }
  }

  onGremioChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? (value as any)?.value ?? value;
    if (val === this.NUEVO_GREMIO_VALUE) {
      this.abrirModalGremioProveedor();
    } else if (val) {
      this.proveedorForm.gremio = val;
    }
  }

  abrirModalTipoProveedor() {
    this.nuevoTipoProveedorNombre = '';
    this.showTipoProveedorModal = true;
  }

  cerrarModalTipoProveedor() {
    this.showTipoProveedorModal = false;
    this.creandoTipoProveedor = false;
    this.proveedorForm.tipo_proveedor = undefined;
  }

  crearTipoProveedor() {
    const nombre = (this.nuevoTipoProveedorNombre || '').trim();
    if (!nombre) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nombre requerido',
        detail: 'Ingresa un nombre para el tipo de proveedor.'
      });
      return;
    }
    if (this.creandoTipoProveedor) return;
    this.creandoTipoProveedor = true;
    this.proveedoresService.crearTipo(nombre).subscribe({
      next: t => {
        this.tiposProveedor = [
          ...this.tiposProveedor.filter(op => op.name !== this.NUEVO_TIPO_VALUE),
          t,
          {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
        ];
        this.proveedorForm.tipo_proveedor = t.name ?? t.label ?? t;
        this.showTipoProveedorModal = false;
        this.creandoTipoProveedor = false;
      },
      error: () => {
        this.creandoTipoProveedor = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el tipo',
          detail: 'Intenta nuevamente.'
        });
      }
    });
  }

  abrirModalGremioProveedor() {
    this.nuevoGremioProveedorNombre = '';
    this.showGremioProveedorModal = true;
  }

  cerrarModalGremioProveedor() {
    this.showGremioProveedorModal = false;
    this.creandoGremioProveedor = false;
    this.proveedorForm.gremio = undefined;
  }

  crearGremioProveedor() {
    const nombre = (this.nuevoGremioProveedorNombre || '').trim();
    if (!nombre) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nombre requerido',
        detail: 'Ingresa un nombre para el gremio.'
      });
      return;
    }
    if (this.creandoGremioProveedor) return;
    this.creandoGremioProveedor = true;
    this.proveedoresService.crearGremio(nombre).subscribe({
      next: g => {
        this.gremiosProveedor = [
          ...this.gremiosProveedor.filter(op => op.name !== this.NUEVO_GREMIO_VALUE),
          g,
          {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
        ];
        this.proveedorForm.gremio = g.name ?? g.label ?? g;
        this.showGremioProveedorModal = false;
        this.creandoGremioProveedor = false;
      },
      error: () => {
        this.creandoGremioProveedor = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el gremio',
          detail: 'Intenta nuevamente.'
        });
      }
    });
  }

  private resetProveedorForm() {
    this.proveedorForm = {
      nombre: '',
      tipo_proveedor: '',
      gremio: '',
      direccion: '',
      contacto: '',
      cuit: '',
      telefono: '',
      email: '',
      activo: true
    };
  }

  private cargarCatalogosProveedor() {
    this.proveedoresService.getTipos().subscribe({
      next: t => this.tiposProveedor = [
        ...t,
        {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
      ],
      error: () => this.tiposProveedor = [
        {label: 'Crear nuevo tipo...', name: this.NUEVO_TIPO_VALUE, nombre: 'Crear nuevo tipo'}
      ]
    });
    this.proveedoresService.getGremios().subscribe({
      next: g => this.gremiosProveedor = [
        ...g,
        {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
      ],
      error: () => this.gremiosProveedor = [
        {label: 'Crear nuevo gremio...', name: this.NUEVO_GREMIO_VALUE, nombre: 'Crear nuevo gremio'}
      ]
    });
  }
}
