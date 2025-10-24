import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, Subscription} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TooltipModule} from 'primeng/tooltip';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';

import {Cliente, Obra} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';

@Component({
  selector: 'app-clientes-detail',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    TagModule,
    ClientesDocumentosComponent
  ],
  providers: [MessageService],
  templateUrl: './clientes-detail.component.html',
  styleUrls: ['./clientes-detail.component.css']
})
export class ClientesDetailComponent implements OnInit, OnDestroy {
  cliente!: Cliente;
  obras: Obra[] = [];
  loading = true;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  editarCliente() {
    this.router.navigate(['/clientes/editar', this.cliente.id]);
  }

  toggleActivo() {
    const actualizado = {...this.cliente, activo: !this.cliente.activo};
    this.clientesService.updateCliente(this.cliente.id!, actualizado).subscribe({
      next: (c) => {
        this.cliente = c;
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

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id]);
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  private cargarDetalle(idCliente: number) {
    this.loading = true;

    forkJoin({
      cliente: this.clientesService.getClienteById(idCliente),
      obras: this.obrasService.getObras()
    }).subscribe({
      next: ({cliente, obras}) => {
        this.cliente = cliente;
        this.obras = obras.filter(o => o.cliente?.id === idCliente);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar',
          detail: 'No se pudo obtener la información del cliente.'
        });
      }
    });
  }
}
