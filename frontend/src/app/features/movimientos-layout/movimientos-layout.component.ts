import { Component, OnDestroy, OnInit } from '@angular/core';
import { Button } from 'primeng/button';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { filter, Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Movimiento } from '../../core/models/models';
import { MovimientosStateService } from '../../services/movimientos/movimientos-state.service';
import { MovimientosModalService } from '../../services/movimientos/movimientos-modal.service';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-movimientos-layout',
  imports: [
    Button,
    RouterLink,
    RouterOutlet,
    Toast,
    ConfirmDialog
  ],
  templateUrl: './movimientos-layout.component.html',
  styleUrl: './movimientos-layout.component.css',
  providers: [MessageService, ConfirmationService]
})
export class MovimientosLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  movimiento?: Movimiento;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private movimientoStateService: MovimientosStateService,
    private movimientosModalService: MovimientosModalService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        // Limpiar movimiento si no estamos en detalle
        if (!this.isDetail()) {
          this.movimiento = undefined;
          this.movimientoStateService.clearMovimiento();
        }
      });
  }

  ngOnInit() {
    // Suscribirse al observable del movimiento
    this.subscription.add(
      this.movimientoStateService.movimientoActual$.subscribe(movimiento => {
        this.movimiento = movimiento || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/movimientos']);
  }

  isDetail(): boolean {
    return /^\/movimientos\/\d+$/.test(this.currentRoute);
  }

  abrirNuevoMovimiento(): void {
    this.movimientosModalService.abrirModal();
  }
}
