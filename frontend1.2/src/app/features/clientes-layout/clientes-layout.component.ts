import { Component, OnDestroy, OnInit } from '@angular/core';
import { Button } from "primeng/button";
import { NavigationEnd, Router, RouterLink, RouterOutlet } from "@angular/router";
import { Toast } from "primeng/toast";
import { filter, Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { Cliente } from '../../core/models/models';
import {ClienteStateService} from '../../services/clientes/clientes-state.service';
import {ClientesService} from '../../services/clientes/clientes.service';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-clientes-layout',
  imports: [
    Button,
    RouterLink,
    RouterOutlet,
    Toast,
    Tooltip,
    ConfirmDialog
  ],
  templateUrl: './clientes-layout.component.html',
  styleUrl: './clientes-layout.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ClientesLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = '';
  cliente?: Cliente;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private clienteStateService: ClienteStateService,
    private clientesService: ClientesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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

  toggleActivo() {
    if (!this.cliente?.id) return;
    const actualizado = { ...this.cliente, activo: !this.cliente.activo };
    if (this.cliente.activo) {
      this.confirmationService.confirm({
        header: 'Confirmar desactivacion',
        message: '¿Seguro que queres desactivar este cliente?',
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

  private ejecutarToggleActivo(actualizado: Cliente) {
    this.clientesService.updateCliente(actualizado.id!, actualizado).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.clienteStateService.setCliente(this.cliente);
        this.messageService.add({
          severity: 'success',
          summary: this.cliente.activo ? 'Cliente activado' : 'Cliente desactivado',
          detail: `El cliente fue ${this.cliente.activo ? 'activado' : 'desactivado'} correctamente.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del cliente.'
        });
      }
    });
  }
}
