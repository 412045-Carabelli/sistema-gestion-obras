import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {ToastModule} from 'primeng/toast';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {filter, Subscription} from 'rxjs';
import {Tooltip} from 'primeng/tooltip';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Obra} from '../../core/models/models';
import {ObrasStateService} from '../../services/obras/obras-state.service';
import {ObrasService} from '../../services/obras/obras.service';

@Component({
  selector: 'app-obras-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ProgressSpinnerModule, RouterLink, Button, Tooltip, ConfirmDialog],
  providers: [MessageService, ConfirmationService],
  templateUrl: './obras-layout.component.html',
  styleUrls: ['./obras-layout.component.css']
})
export class ObrasLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  obra?: Obra;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private obraStateService: ObrasStateService,
    private obrasService: ObrasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        // ⬅️ LIMPIAR OBRA SI NO ESTAMOS EN DETALLE
        if (!this.isDetail()) {
          this.obra = undefined;
          this.obraStateService.clearObra();
        }
      });
  }

  ngOnInit() {
    // Suscribirse al observable de la obra
    this.subscription.add(
      this.obraStateService.obraActual$.subscribe(obra => {
        this.obra = obra || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/obras']);
  }

  isDetail(): boolean {
    return /^\/obras\/\d+$/.test(this.currentRoute);
  }

  toggleActivo() {
    const obra = this.obra;
    if (!obra?.id) return;
    if (obra.activo) {
      this.confirmationService.confirm({
        header: 'Confirmar desactivacion',
        message: '¿Seguro que queres desactivar esta obra?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Desactivar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger p-button-sm',
        rejectButtonStyleClass: 'p-button-text p-button-sm',
        accept: () => this.ejecutarToggleActivo(obra)
      });
      return;
    }
    this.ejecutarToggleActivo(obra);
  }

  private ejecutarToggleActivo(obra: Obra) {
    this.obrasService.activarObra(obra.id!).subscribe({
      next: () => {
        this.obra = { ...obra, cliente: obra.cliente, activo: !obra.activo };
        this.obraStateService.setObra(this.obra);
        this.messageService.add({
          severity: 'success',
          summary: this.obra.activo ? 'Obra activada' : 'Obra desactivada',
          detail: `La obra fue ${this.obra.activo ? 'activada' : 'desactivada'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de la obra.'
        });
      }
    });
  }
}
