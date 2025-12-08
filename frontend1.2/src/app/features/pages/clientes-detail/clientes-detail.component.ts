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
import {CurrencyPipe, CommonModule} from '@angular/common';

import {Cliente, CONDICION_IVA_LABELS, CondicionIva, Obra} from '../../../core/models/models';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesDocumentosComponent} from '../../components/clientes-documentos/clientes-documentos.component';
import {ClienteStateService} from '../../../services/clientes/clientes-state.service';
import {StyleClass} from 'primeng/styleclass';

@Component({
  selector: 'app-clientes-detail',
  standalone: true,
  imports: [
    CommonModule,
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
    ClientesDocumentosComponent,
    CurrencyPipe,
    StyleClass
  ],
  providers: [MessageService],
  templateUrl: './clientes-detail.component.html',
  styleUrls: ['./clientes-detail.component.css']
})
export class ClientesDetailComponent implements OnInit, OnDestroy {
  cliente!: Cliente;
  obras: Obra[] = [];
  loading = true;
  readonly condicionIvaLabels = CONDICION_IVA_LABELS;

  // Estadísticas calculadas
  obrasActivas = 0;
  totalPresupuestado = 0;
  saldoPendiente = 0;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private obrasService: ObrasService,
    private messageService: MessageService,
    private clienteStateService: ClienteStateService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarDetalle(id);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.clienteStateService.clearCliente();
  }

  editarCliente() {
    this.router.navigate(['/clientes/editar', this.cliente.id]);
  }

  toggleActivo() {
    const actualizado = {...this.cliente, activo: !this.cliente.activo};
    this.clientesService.updateCliente(this.cliente.id!, actualizado).subscribe({
      next: (c) => {
        this.cliente = c;
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

  verObra(obra: Obra) {
    this.router.navigate(['/obras', obra.id]);
  }

  getActivoSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getEstadosResumen(): { nombre: string; cantidad: number }[] {
    if (!this.obras || this.obras.length === 0) {
      return [];
    }

    const mapa: Record<string, number> = {};

    for (const obra of this.obras) {
      const estado = obra.obra_estado || 'Sin estado';
      mapa[estado] = (mapa[estado] || 0) + 1;
    }

    return Object.entries(mapa)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  private cargarDetalle(idCliente: number) {
    this.loading = true;

    forkJoin({
      cliente: this.clientesService.getClienteById(idCliente),
      obras: this.obrasService.getObras()
    }).subscribe({
      next: ({cliente, obras}) => {
        this.cliente = cliente;
        this.clienteStateService.setCliente(this.cliente);

        // Filtrar obras del cliente
        this.obras = obras.filter(o => o.cliente?.id === idCliente);

        // Calcular estadísticas
        this.calcularEstadisticas();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.clienteStateService.clearCliente();

        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar',
          detail: 'No se pudo obtener la información del cliente.'
        });
      }
    });
  }

  private calcularEstadisticas() {
    // Obras activas (estados: en progreso, iniciada, etc.)
    const estadosActivos = ['en progreso', 'iniciada', 'en curso'];
    this.obrasActivas = this.obras.filter(o =>
      estadosActivos.some(estado =>
        o.obra_estado?.toLowerCase().includes(estado)
      )
    ).length;

    // Total presupuestado
    this.totalPresupuestado = this.obras.reduce((sum, obra) =>
      sum + (obra.presupuesto || 0), 0
    );

    // Saldo pendiente (ejemplo simplificado)
    // Aquí deberías calcular: presupuesto total - pagos realizados
    // Por ahora usamos un cálculo estimado (40% del presupuesto)
    this.saldoPendiente = this.totalPresupuestado * 0.4;
  }

  getCondicionIvaLabel(value?: string | CondicionIva): string {
    if (!value) return 'No informado';
    return this.condicionIvaLabels[value as CondicionIva] ?? 'No informado';
  }
}
