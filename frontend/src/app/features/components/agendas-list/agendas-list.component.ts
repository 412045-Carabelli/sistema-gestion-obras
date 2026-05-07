import {Component, OnInit, OnDestroy, signal, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {RouterLink} from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {MultiSelectModule} from 'primeng/multiselect';
import {TagModule} from 'primeng/tag';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {ButtonModule} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {DialogModule} from 'primeng/dialog';
import {InputTextarea} from 'primeng/inputtextarea';
import {DropdownModule} from 'primeng/dropdown';
import {TooltipModule} from 'primeng/tooltip';

import {Agenda, ESTADOS_AGENDA_OPCIONES, Obra, Cliente, Proveedor} from '../../../core/models/models';
import {AgendasService} from '../../../services/agendas/agendas.service';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {ClientesService} from '../../../services/clientes/clientes.service';
import {ProveedoresService} from '../../../services/proveedores/proveedores.service';
import {AgendaModalComponent} from './agenda-modal/agenda-modal.component';

interface EstadoOption {
  label: string;
  name: string;
}

@Component({
  selector: 'app-agendas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    MultiSelectModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    ToastModule,
    RouterLink,
    DialogModule,
    InputTextarea,
    DropdownModule,
    TooltipModule,
    AgendaModalComponent
  ],
  providers: [MessageService],
  templateUrl: './agendas-list.component.html',
  styleUrls: ['./agendas-list.component.css']
})
export class AgendasListComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private agendasService = inject(AgendasService);
  private tareasService = inject(TareasService);
  private obrasService = inject(ObrasService);
  private clientesService = inject(ClientesService);
  private proveedoresService = inject(ProveedoresService);
  private route = inject(ActivatedRoute);
  private subscription = new Subscription();

  // Signals
  agendas = signal<Agenda[]>([]);
  searchValue = signal('');
  estadoFiltro = signal<string[]>([]);
  datosCargados = signal<boolean>(false);
  mostrarModal = signal(false);
  agendaSeleccionada = signal<Agenda | null>(null);
  obras = signal<Obra[]>([]);
  clientes = signal<Cliente[]>([]);
  proveedores = signal<Proveedor[]>([]);

  // Computed
  agendasFiltradas = computed(() => {
    const agendas = this.agendas();
    const search = this.searchValue().toLowerCase();
    const estados = this.estadoFiltro();

    return agendas.filter(agenda => {
      const matchesSearch = !search || 
        agenda.titulo.toLowerCase().includes(search) ||
        (agenda.descripcion?.toLowerCase().includes(search) || false);

      const matchesEstado = estados.length === 0 || 
        estados.includes(agenda.estado);

      return matchesSearch && matchesEstado;
    }).sort((a, b) => {
      const fechaA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
      const fechaB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
      return fechaB - fechaA;
    });
  });

  estadosOptions: EstadoOption[] = ESTADOS_AGENDA_OPCIONES;

  ngOnInit() {
    this.cargarDatos();
    this.subscription.add(
      this.agendasService.crearNuevaAgenda$.subscribe(() => {
        this.abrirModalCrear();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private cargarDatos() {
    this.obrasService.getObrasAll().subscribe({
      next: (obras) => this.obras.set(obras),
      error: () => {}
    });

    this.clientesService.getClientes().subscribe({
      next: (clientes) => this.clientes.set(clientes),
      error: () => {}
    });

    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores) => this.proveedores.set(proveedores),
      error: () => {}
    });

    this.cargarAgendas();
  }

  private cargarAgendas() {
    this.agendasService.getAgendas().subscribe({
      next: (agendas: Agenda[]) => {
        this.agendas.set(agendas);
        this.datosCargados.set(true);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las agendas'
        });
        this.datosCargados.set(true);
      }
    });
  }

  abrirModalCrear() {
    this.agendaSeleccionada.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalDetalle(agenda: Agenda) {
    this.agendaSeleccionada.set(agenda);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.agendaSeleccionada.set(null);
  }

  onAgendaGuardada(agenda: Agenda) {
    if (this.agendaSeleccionada()) {
      const index = this.agendas().findIndex(a => a.id === agenda.id);
      if (index > -1) {
        const nuevasAgendas = [...this.agendas()];
        nuevasAgendas[index] = agenda;
        this.agendas.set(nuevasAgendas);
      }
    } else {
      this.agendas.set([...this.agendas(), agenda]);
    }
    this.cerrarModal();
  }

  onAgendaEliminada(id: number) {
    this.agendas.set(this.agendas().filter(a => a.id !== id));
    this.cerrarModal();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Tarea eliminada'
    });
  }

  onEstadoChange() {
    // El computed se actualiza automáticamente
  }

  getEstadoSeverity(estado: string): string {
    const severities: Record<string, string> = {
      'PENDIENTE': 'warning',
      'EN_PROGRESO': 'info',
      'COMPLETADA': 'success'
    };
    return severities[estado] || 'secondary';
  }

  getEstadoLabel(estado: string): string {
    return ESTADOS_AGENDA_OPCIONES.find(e => e.name === estado)?.label || estado;
  }

  cambiarEstado(agenda: Agenda, nuevoEstado: string) {
    this.agendasService.cambiarEstado(agenda.id!, nuevoEstado).subscribe({
      next: (resultado) => {
        const index = this.agendas().findIndex(a => a.id === agenda.id);
        if (index > -1) {
          const nuevasAgendas = [...this.agendas()];
          nuevasAgendas[index] = resultado;
          this.agendas.set(nuevasAgendas);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `La tarea cambió a ${this.getEstadoLabel(nuevoEstado)}`,
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado',
          life: 3000
        });
      }
    });
  }

  getNombreObra(obraId: number | null | undefined): string {
    if (!obraId) return 'N/A';
    const obra = this.obras().find(o => o.id === obraId);
    return obra?.nombre || 'N/A';
  }

  getNombreCliente(clienteId: number | null | undefined): string {
    if (!clienteId) return 'N/A';
    const cliente = this.clientes().find(c => c.id === clienteId);
    return cliente?.nombre || 'N/A';
  }

  getNombreProveedor(proveedorId: number | null | undefined): string {
    if (!proveedorId) return 'N/A';
    const proveedor = this.proveedores().find(p => p.id === proveedorId);
    return proveedor?.nombre || 'N/A';
  }
}
