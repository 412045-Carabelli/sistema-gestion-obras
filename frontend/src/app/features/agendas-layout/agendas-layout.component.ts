import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {ToastModule} from 'primeng/toast';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Button} from 'primeng/button';
import {LayoutHeaderComponent} from '../../shared/layout-header/layout-header.component';
import {filter, Subscription} from 'rxjs';
import {Tooltip} from 'primeng/tooltip';
import {CommonModule} from '@angular/common';
import {AgendasService} from '../../services/agendas/agendas.service';

@Component({
  selector: 'app-agendas-layout',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialog, Button, RouterLink, Tooltip, CommonModule, LayoutHeaderComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './agendas-layout.component.html',
  styleUrls: ['./agendas-layout.component.css']
})
export class AgendasLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  private subscription = new Subscription();
  private agendasService = inject(AgendasService);

  constructor(
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/agendas']);
  }

  navegarVista(ruta: string) {
    this.router.navigate([ruta]);
  }

  abrirModalCrearAgenda() {
    this.agendasService.emitirCrearNuevaAgenda();
  }
}
