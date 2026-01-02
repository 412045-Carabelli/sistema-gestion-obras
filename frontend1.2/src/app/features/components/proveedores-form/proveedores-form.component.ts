import {PreventInvalidSubmitDirective} from "../../../shared/directives/prevent-invalid-submit.directive";
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {CommonModule} from '@angular/common';
import {Proveedor} from '../../../core/models/models';
import {CatalogoOption, ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {InputText} from 'primeng/inputtext';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-proveedores-form',
  standalone: true,
  imports: [
    PreventInvalidSubmitDirective,
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    ButtonModule,
    InputText,
    ModalComponent,
    RouterLink
  ],
  templateUrl: './proveedores-form.component.html'
})
export class ProveedoresFormComponent implements OnInit {
  @Input() initialData?: Proveedor;
  @Output() formSubmit = new EventEmitter<Proveedor>();

  form!: FormGroup;
  tipos: CatalogoOption[] = [];
  gremios: CatalogoOption[] = [];
  tiposOptions: CatalogoOption[] = [];
  gremiosOptions: CatalogoOption[] = [];

  nuevoTipoForm!: FormGroup;
  nuevoGremioForm!: FormGroup;

  showTipoModal = false;
  showGremioModal = false;
  creandoTipo = false;
  creandoGremio = false;

  private readonly NUEVO_TIPO_VALUE = '__nuevo_tipo__';
  private readonly NUEVO_GREMIO_VALUE = '__nuevo_gremio__';

  constructor(private fb: FormBuilder, private service: ProveedoresService) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.initialData?.nombre ?? '', Validators.required],
      tipo_proveedor: [this.initialData?.tipo_proveedor ?? null, Validators.required],
      gremio: [this.initialData?.gremio ?? null],
      contacto: [this.initialData?.contacto ?? '', Validators.required],
      direccion: [this.initialData?.direccion ?? ''],
      cuit: [this.initialData?.cuit ?? '', Validators.required],
      telefono: [this.initialData?.telefono ?? '', Validators.required],
      email: [this.initialData?.email ?? '', Validators.email],
      activo: [this.initialData?.activo ?? true]
    });

    this.nuevoTipoForm = this.fb.group({
      nombre: ['', Validators.required]
    });

    this.nuevoGremioForm = this.fb.group({
      nombre: ['', Validators.required]
    });

    this.service.getTipos().subscribe(t => {
      this.tipos = t;
      this.tiposOptions = this.appendCrearOption(this.tipos, 'tipo');
      this.setInitialDropdownValue('tipo_proveedor', this.tiposOptions);
    });

    this.service.getGremios().subscribe(g => {
      this.gremios = g;
      this.gremiosOptions = this.appendCrearOption(this.gremios, 'gremio');
      this.setInitialDropdownValue('gremio', this.gremiosOptions);
    });
  }

  onSubmit() {
    if (this.form.valid) this.formSubmit.emit(this.form.value);
  }

  onTipoChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? value;
    if (val === this.NUEVO_TIPO_VALUE) {
      this.form.get('tipo_proveedor')?.setValue(null);
      this.nuevoTipoForm.reset();
      this.showTipoModal = true;
    } else if (val) {
      this.form.get('tipo_proveedor')?.setValue(val);
    }
  }

  onGremioChange(value: CatalogoOption | string | null) {
    const val = (value as CatalogoOption)?.name ?? value;
    if (val === this.NUEVO_GREMIO_VALUE) {
      this.form.get('gremio')?.setValue(null);
      this.nuevoGremioForm.reset();
      this.showGremioModal = true;
    } else if (val) {
      this.form.get('gremio')?.setValue(val);
    }
  }

  crearNuevoTipo() {
    if (this.nuevoTipoForm.invalid || this.creandoTipo) return;
    const nombre = (this.nuevoTipoForm.value.nombre as string).trim();
    if (!nombre) return;
    this.creandoTipo = true;
    this.service.crearTipo(nombre).subscribe({
      next: (tipo) => {
        this.tipos = this.mergeOption(tipo, this.tipos);
        this.tiposOptions = this.appendCrearOption(this.tipos, 'tipo');
        this.form.get('tipo_proveedor')?.setValue(tipo.name);
        this.showTipoModal = false;
        this.creandoTipo = false;
      },
      error: () => {
        this.creandoTipo = false;
      }
    });
  }

  crearNuevoGremio() {
    if (this.nuevoGremioForm.invalid || this.creandoGremio) return;
    const nombre = (this.nuevoGremioForm.value.nombre as string).trim();
    if (!nombre) return;
    this.creandoGremio = true;
    this.service.crearGremio(nombre).subscribe({
      next: (gremio) => {
        this.gremios = this.mergeOption(gremio, this.gremios);
        this.gremiosOptions = this.appendCrearOption(this.gremios, 'gremio');
        this.form.get('gremio')?.setValue(gremio.name);
        this.showGremioModal = false;
        this.creandoGremio = false;
      },
      error: () => {
        this.creandoGremio = false;
      }
    });
  }

  closeTipoModal() {
    this.showTipoModal = false;
    this.creandoTipo = false;
  }

  closeGremioModal() {
    this.showGremioModal = false;
    this.creandoGremio = false;
  }

  private appendCrearOption(list: CatalogoOption[], tipo: 'tipo' | 'gremio'): CatalogoOption[] {
    const crearOption: CatalogoOption = {
      label: tipo === 'tipo' ? 'Crear nuevo tipo...' : 'Crear nuevo gremio...',
      name: tipo === 'tipo' ? this.NUEVO_TIPO_VALUE : this.NUEVO_GREMIO_VALUE,
      nombre: tipo === 'tipo' ? 'Crear nuevo tipo' : 'Crear nuevo gremio'
    };
    return [...list, crearOption];
  }

  private mergeOption(option: CatalogoOption, list: CatalogoOption[]): CatalogoOption[] {
    const filtered = list.filter(item => item.name !== option.name);
    return [...filtered, option];
  }

  private setInitialDropdownValue(control: 'tipo_proveedor' | 'gremio', options: CatalogoOption[]) {
    const current = this.form.get(control)?.value;
    if (!current) return;

    const match = options.find(opt =>
      opt.name === current ||
      opt.label === current ||
      opt.nombre === current ||
      opt.name === (current as any)?.name
    );

    if (match) {
      this.form.get(control)?.setValue(match.name);
    }
  }
}
