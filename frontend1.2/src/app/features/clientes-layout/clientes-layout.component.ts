import { Component, OnDestroy, OnInit } from '@angular/core';
import { Button } from "primeng/button";
import { NavigationEnd, Router, RouterLink, RouterOutlet } from "@angular/router";
import { Toast } from "primeng/toast";
import { filter, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { Cliente } from '../../core/models/models';
import {ClienteStateService} from '../../services/clientes/clientes-state.service';

@Component({
  selector: 'app-clientes-layout',
  imports: [
    Button,
    RouterLink,
    RouterOutlet,
    Toast,
    Tooltip
  ],
  templateUrl: './clientes-layout.component.html',
  styleUrl: './clientes-layout.component.css',
  providers: [MessageService]
})
export class ClientesLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  cliente?: Cliente;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private clienteStateService: ClienteStateService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;

        // Limpiar cliente si no estamos en detalle
        if (!this.isDetail()) {
          this.cliente = undefined;
          this.clienteStateService.clearCliente();
        }
      });
  }

  ngOnInit() {
    // Suscribirse al observable del cliente
    this.subscription.add(
      this.clienteStateService.clienteActual$.subscribe(cliente => {
        this.cliente = cliente || undefined;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/clientes']);
  }

  isDetail(): boolean {
    return /^\/clientes\/\d+$/.test(this.currentRoute);
  }
}
