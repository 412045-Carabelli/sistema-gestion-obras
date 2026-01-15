import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { filter, Subscription } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
import {ProveedoresStateService} from '../../services/proveedores/proveedores-state.service';
import {ProveedoresService} from '../../services/proveedores/proveedores.service';
import {Proveedor} from '../../core/models/models';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-proveedores-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastModule,
    ProgressSpinnerModule,
    RouterLink,
    Button,
    Tooltip,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './proveedores-layout.component.html',
  styleUrls: ['./proveedores-layout.component.css']
})
export class ProveedoresLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  proveedor?: Proveedor;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private proveedorStateService: ProveedoresStateService,
    private proveedoresService: ProveedoresService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        if (!this.isDetail()) {
          this.proveedor = undefined;
          this.proveedorStateService.clearProveedor(); // Descomenta cuando tengas el servicio
        }
      });
  }

  ngOnInit() {
    this.subscription.add(
      this.proveedorStateService.proveedorActual$.subscribe(proveedor => {
        this.proveedor = proveedor || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/proveedores']);
  }

  isDetail(): boolean {
    return /^\/proveedores\/\d+$/.test(this.currentRoute);
  }

  toggleActivo() {
    if (!this.proveedor?.id) return;
    const actualizado = { ...this.proveedor, activo: !this.proveedor.activo };
    if (this.proveedor.activo) {
      this.confirmationService.confirm({
        header: 'Confirmar desactivacion',
        message: '¿Seguro que queres desactivar este proveedor?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Desactivar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger p-button-sm',
        rejectButtonStyleClass: 'p-button-text p-button-sm',
        accept: () => this.ejecutarToggleActivo(actualizado)
      });
      return;
    }
    this.ejecutarToggleActivo(actualizado);
  }

  private ejecutarToggleActivo(actualizado: Proveedor) {
    this.proveedoresService.updateProveedor(actualizado.id!, actualizado).subscribe({
      next: (proveedor) => {
        this.proveedor = proveedor;
        this.proveedorStateService.setProveedor(this.proveedor);
        this.messageService.add({
          severity: 'success',
          summary: this.proveedor.activo ? 'Proveedor activado' : 'Proveedor desactivado',
          detail: `El proveedor fue ${this.proveedor.activo ? 'activado' : 'desactivado'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del proveedor.'
        });
      }
    });
  }
}
