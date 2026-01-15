import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {DatePipe} from '@angular/common';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {filter, Subscription} from 'rxjs';
import {Factura} from '../../core/models/models';
import {FacturasStateService} from '../../services/facturas/facturas-state.service';
import {FacturasService} from '../../services/facturas/facturas.service';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-facturas-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, RouterLink, Button, Tooltip, DatePipe, ConfirmDialog],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-layout.component.html',
  styleUrls: ['./facturas-layout.component.css']
})
export class FacturasLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  factura?: Factura;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private facturasStateService: FacturasStateService,
    private facturasService: FacturasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        if (!this.isDetail()) {
          this.factura = undefined;
          this.facturasStateService.clearFactura();
        }
      });
  }

  ngOnInit() {
    this.subscription.add(
      this.facturasStateService.facturaActual$.subscribe(factura => {
        this.factura = factura || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/facturas']);
  }

  isDetail(): boolean {
    return /^\/facturas\/\d+$/.test(this.currentRoute);
  }

  eliminarFactura() {
    if (!this.factura?.id) return;
    const facturaId = this.factura.id;
    this.confirmationService.confirm({
      header: 'Confirmar eliminacion',
      message: '¿Seguro que queres eliminar esta factura?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.facturasService.deleteFactura(facturaId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Factura eliminada',
              detail: 'La factura se elimino correctamente.'
            });
            this.router.navigate(['/facturas']);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la factura.'
            });
          }
        });
      }
    });
  }
}
