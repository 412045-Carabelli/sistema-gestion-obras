import {PreventInvalidSubmitDirective} from "../../../shared/directives/prevent-invalid-submit.directive";
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {CommonModule} from '@angular/common';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-proveedores-form',
  standalone: true,
  imports: [PreventInvalidSubmitDirective, CommonModule, ReactiveFormsModule, DropdownModule, ButtonModule, InputText, Select],
  templateUrl: './proveedores-form.component.html'
})
export class ProveedoresFormComponent implements OnInit {
  @Input() initialData?: Proveedor;
  @Output() formSubmit = new EventEmitter<Proveedor>();

  form!: FormGroup;
  tipos: { label: string; name: string }[] = [];
  gremios: { label: string; name: string }[] = [];

  constructor(private fb: FormBuilder, private service: ProveedoresService) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.initialData?.nombre ?? '', Validators.required],
      tipo_proveedor: [this.initialData?.tipo_proveedor ?? null, Validators.required],
      gremio: [this.initialData?.gremio ?? null, Validators.required],
      contacto: [this.initialData?.contacto ?? '', Validators.required],
      direccion: [this.initialData?.direccion ?? ''],
      cuit: [this.initialData?.cuit ?? '', Validators.required],
      telefono: [this.initialData?.telefono ?? '', Validators.required],
      email: [this.initialData?.email ?? '', Validators.required],
      activo: [this.initialData?.activo ?? true]
    });

    this.service.getTipos().subscribe(t => {
      this.tipos = t;
    });

    this.service.getGremios().subscribe(g => {
      this.gremios = g;
    });
  }

  onSubmit() {
    if (this.form.valid) this.formSubmit.emit(this.form.value);
  }
}



