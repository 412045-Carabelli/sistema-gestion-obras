import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {ToastModule} from 'primeng/toast';
import {CommonModule} from '@angular/common';
import {ProveedoresFormComponent} from '../../components/proveedores-form/proveedores-form.component';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-proveedores-create',
  standalone: true,
  imports: [CommonModule, ToastModule, ProveedoresFormComponent],
  providers: [MessageService],
  templateUrl: './proveedores-create.component.html'
})
export class ProveedoresCreateComponent {
  guardando = false;

  constructor(
    private proveedoresService: ProveedoresService,
    private router: Router,
    private messageService: MessageService
  ) {
  }

  private normalizarTelefono(tel: string | undefined): string {
    if (!tel) return '';
    let solo = String(tel).replace(/[^0-9]/g, '');
    if (solo.startsWith('549')) solo = '54' + solo.substring(3);
    else if (solo.startsWith('54')) return solo;
    else if (solo.startsWith('9')) solo = '54' + solo.substring(1);
    else solo = '54' + solo;
    return solo;
  }

  onFormSubmit(proveedor: Proveedor) {
    if (this.guardando) return;
    if (proveedor.telefono) proveedor.telefono = this.normalizarTelefono(proveedor.telefono);
    this.guardando = true;
    this.proveedoresService.createProveedor(proveedor).subscribe({
      next: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor creado',
          detail: 'El proveedor se ha registrado correctamente.'
        });
        setTimeout(() => this.router.navigate(['/proveedores']), 800);
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el proveedor.'
        });
      }
    });
  }
}
