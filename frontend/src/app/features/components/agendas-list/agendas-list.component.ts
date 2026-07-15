import {Component, OnInit, OnDestroy, signal, computed, inject} from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import {WhatsAppService} from '../../../services/whatsapp/whatsapp.service';
import {AgendaModalComponent} from './agenda-modal/agenda-modal.component';
import {AgendasGanttComponent} from '../agendas-gantt/agendas-gantt.component';
import {GenericFilterBarComponent, FilterDefinition, FilterAction, ViewToggleOption} from '../generic-filter-bar/generic-filter-bar.component';

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
    AgendaModalComponent,
    AgendasGanttComponent,
    GenericFilterBarComponent
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
  private whatsAppService = inject(WhatsAppService);
  private route = inject(ActivatedRoute);

  enviandoWhatsApp = false;
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

  // Filter Bar
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];
  currentFilters: Record<string, any> = {};
  vistaActual = signal<'lista' | 'gantt'>('lista');
  viewToggle!: { options: ViewToggleOption[] };

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
    this.viewToggle = {
      options: [
        { label: 'Lista', icon: 'pi-list', callback: () => this.vistaActual.set('lista'), isActive: () => this.vistaActual() === 'lista' },
        { label: 'Gantt', icon: 'pi-chart-bar', callback: () => this.vistaActual.set('gantt'), isActive: () => this.vistaActual() === 'gantt' }
      ]
    };
    this.setupFilterDefinitions();
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

  private setupFilterDefinitions(): void {
    this.filterActions = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'danger',
        callback: () => this.exportarPDF()
      },
      // TODO: WhatsApp deshabilitado temporalmente
      // {
      //   label: 'WhatsApp (24h)',
      //   icon: 'pi pi-whatsapp',
      //   severity: 'success',
      //   callback: () => this.triggerWhatsApp24h()
      // },
      // {
      //   label: 'Resumen semanal',
      //   icon: 'pi pi-calendar',
      //   severity: 'info',
      //   callback: () => this.triggerResumenSemanal()
      // }
    ];

    this.filterDefinitions = [
      {
        key: 'search',
        label: 'Buscar',
        type: 'input',
        placeholder: 'Por título o descripción'
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'select',
        placeholder: 'Todos',
        options: ESTADOS_AGENDA_OPCIONES.map(e => ({ label: e.label, value: e.name }))
      }
    ];
  }

  onFilterChange(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.searchValue.set(filters['search'] || '');
    this.estadoFiltro.set(filters['estado'] ? (Array.isArray(filters['estado']) ? filters['estado'] : [filters['estado']]) : []);
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.searchValue.set('');
    this.estadoFiltro.set([]);
  }

  private cargarDatos() {
    this.obrasService.getObrasAll().subscribe({
      next: (obras) => this.obras.set([...obras].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))),
      error: () => {}
    });

    this.clientesService.getClientes().subscribe({
      next: (clientes) => this.clientes.set([...clientes].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))),
      error: () => {}
    });

    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores) => this.proveedores.set([...proveedores].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))),
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


  getEstadoSeverity(estado: string): string {
    const severities: Record<string, string> = {
      'PENDIENTE': 'danger',
      'EN_PROGRESO': 'success',
      'COMPLETADA': 'secondary'
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

  exportarPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toLocaleDateString('es-AR');

    doc.setFontSize(14);
    doc.text('Agenda de Eventos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exportado: ${fecha}`, 14, 22);

    const rows = this.agendasFiltradas().map(a => [
      a.id ?? '',
      a.titulo,
      this.getNombreObra(a.obraId),
      this.getNombreCliente(a.clienteId),
      this.getNombreProveedor(a.proveedorId),
      this.getEstadoLabel(a.estado),
      a.fechaVencimiento ? new Date(a.fechaVencimiento).toLocaleDateString('es-AR') : '-',
      a.creadoEn ? new Date(a.creadoEn).toLocaleDateString('es-AR') : '-'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['N°', 'Título', 'Obra', 'Cliente', 'Proveedor', 'Estado', 'Vencimiento', 'Fecha Alta']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`agenda-eventos-${fecha.replace(/\//g, '-')}.pdf`);
  }

  triggerWhatsApp24h() {
    if (this.enviandoWhatsApp) return;
    this.enviandoWhatsApp = true;
    this.whatsAppService.triggerAgendaNotificaciones().subscribe({
      next: (res) => {
        this.enviandoWhatsApp = false;
        this.messageService.add({
          severity: res.ok ? 'success' : 'error',
          summary: res.ok ? 'WhatsApp enviado' : 'Error',
          detail: res.mensaje || (res.ok ? 'Notificaciones enviadas' : res.error || 'Error desconocido'),
          life: 5000
        });
      },
      error: () => {
        this.enviandoWhatsApp = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de conexión',
          detail: 'No se pudo contactar al servidor de notificaciones'
        });
      }
    });
  }

  triggerResumenSemanal() {
    if (this.enviandoWhatsApp) return;
    this.enviandoWhatsApp = true;
    this.whatsAppService.triggerResumenSemanal().subscribe({
      next: (res) => {
        this.enviandoWhatsApp = false;
        this.messageService.add({
          severity: res.ok ? 'success' : 'error',
          summary: res.ok ? 'Resumen semanal enviado' : 'Error',
          detail: res.mensaje || (res.ok ? 'Resumen enviado' : res.error || 'Error desconocido'),
          life: 5000
        });
      },
      error: () => {
        this.enviandoWhatsApp = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de conexión',
          detail: 'No se pudo contactar al servidor de notificaciones'
        });
      }
    });
  }

  imprimirListado(): void {
    window.print();
  }
}
