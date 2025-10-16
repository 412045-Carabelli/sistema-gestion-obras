import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ProveedoresFormComponent} from '../../components/proveedores-form/proveedores-form.component';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {ToastModule} from 'primeng/toast';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-proveedores-create',
  standalone: true,
  imports: [CommonModule, ToastModule, ProveedoresFormComponent],
  providers: [MessageService],
  templateUrl: './proveedores-create.component.html'
})
export class ProveedoresCreateComponent {

  constructor(
    private proveedoresService: ProveedoresService,
    private router: Router,
    private messageService: MessageService
  ) {
  }

  onFormSubmit(proveedor: Proveedor) {
    this.proveedoresService.createProveedor(proveedor).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'El proveedor se ha registrado correctamente.'
        });
        setTimeout(() => this.router.navigate(['/proveedores']), 800);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el proveedor.'
        });
      }
    });
  }
}
