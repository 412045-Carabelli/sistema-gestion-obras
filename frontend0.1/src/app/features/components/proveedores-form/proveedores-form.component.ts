import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Proveedor, TipoProveedor } from '../../../core/models/models';
import { ProveedoresService } from '../../../services/proveedores/proveedores.service';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-proveedores-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownModule, ButtonModule, InputText, Select],
  templateUrl: './proveedores-form.component.html'
})
export class ProveedoresFormComponent implements OnInit {
  @Input() initialData?: Proveedor;
  @Output() formSubmit = new EventEmitter<Proveedor>();

  form!: FormGroup;
  tipos: TipoProveedor[] = [];

  constructor(private fb: FormBuilder, private service: ProveedoresService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.initialData?.nombre ?? '', Validators.required],
      tipo_proveedor: [this.initialData?.tipo_proveedor ?? null, Validators.required],
      contacto: [this.initialData?.contacto ?? ''],
      telefono: [this.initialData?.telefono ?? ''],
      email: [this.initialData?.email ?? '']
    });

    this.service.getTipos().subscribe(t => (this.tipos = t));
  }

  onSubmit() {
    if (this.form.valid) this.formSubmit.emit(this.form.value);
  }
}
