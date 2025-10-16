import {Component, OnInit} from '@angular/core';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {Cliente} from '../../../core/models/models';
import {Router} from '@angular/router';
import {Button} from 'primeng/button';
import {ClientesListComponent} from '../../components/clientes-list/clientes-list.component';

@Component({
  selector: 'app-clientes-page',
  imports: [
    Button,
    ClientesListComponent
  ],
  templateUrl: './clientes.component.html'
})
export class ClientesPageComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(
    private clientesService: ClientesService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe({
      next: (data) => (this.clientes = data),
      error: (err) => console.error('Error al cargar clientes', err),
    });
  }

  nuevoCliente() {
    // Podés llevarlo a un formulario de creación
    this.router.navigate(['/clientes/nuevo']);
  }

  verCliente(cliente: Cliente) {
    // Podés mostrar detalles o navegar
    this.router.navigate(['/clientes', cliente.id]);
  }
}
