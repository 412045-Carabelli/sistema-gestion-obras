import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ProveedoresFormComponent} from '../../components/proveedores-form/proveedores-form.component';
import {Proveedor} from '../../../core/models/models';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {ToastModule} from 'primeng/toast';
import {CommonModule} from '@angular/common';
import {ProgressSpinner} from 'primeng/progressspinner';

@Component({
  selector: 'app-proveedores-edit',
  standalone: true,
  imports: [CommonModule, ToastModule, ProveedoresFormComponent, ProgressSpinner],
  providers: [MessageService],
  templateUrl: './proveedores-edit.component.html'
})
export class ProveedoresEditComponent implements OnInit {
  proveedor!: Proveedor;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private proveedoresService: ProveedoresService,
    private router: Router,
    private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.proveedoresService.getProveedorById(id).subscribe({
        next: (data) => {
          this.proveedor = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el proveedor.'
          });
        }
      });
    }
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
    if (proveedor.telefono) proveedor.telefono = this.normalizarTelefono(proveedor.telefono);
    this.proveedoresService.updateProveedor(this.proveedor.id!, proveedor).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Proveedor actualizado',
          detail: 'Los cambios se guardaron correctamente.'
        });
        setTimeout(() => this.router.navigate(['/proveedores', this.proveedor.id!]), 800);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el proveedor.'
        });
      }
    });
  }
}
