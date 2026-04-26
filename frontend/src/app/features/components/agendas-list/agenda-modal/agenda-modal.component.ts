import {Component, Input, Output, EventEmitter, signal, effect, inject, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextarea} from 'primeng/inputtextarea';
import {DropdownModule} from 'primeng/dropdown';
import {DividerModule} from 'primeng/divider';
import {MessageService, ConfirmationService} from 'primeng/api';

import {Agenda, ESTADOS_AGENDA_OPCIONES, Obra, Cliente, Proveedor} from '../../../../core/models/models';
import {AgendasService} from '../../../../services/agendas/agendas.service';
import {ObrasService} from '../../../../services/obras/obras.service';
import {ClientesService} from '../../../../services/clientes/clientes.service';
import {ProveedoresService} from '../../../../services/proveedores/proveedores.service';

@Component({
  selector: 'app-agenda-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    DividerModule
  ],
  templateUrl: './agenda-modal.component.html',
  styleUrls: ['./agenda-modal.component.css']
})
export class AgendaModalComponent {
  visible = input<boolean>(false);
  agenda = input<Agenda | null>(null);
  @Output() onClose = new EventEmitter<void>();
  @Output() onGuardada = new EventEmitter<Agenda>();
  @Output() onEliminada = new EventEmitter<number>();

  private agendasService = inject(AgendasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private obrasService = inject(ObrasService);
  private clientesService = inject(ClientesService);
  private proveedoresService = inject(ProveedoresService);

  form!: FormGroup;
  guardando = signal(false);
  esEdicion = signal(false);
  estadosOptions = ESTADOS_AGENDA_OPCIONES;
  obrasOptions = signal<Array<{label: string; value: number}>>([]);
  clientesOptions = signal<Array<{label: string; value: number}>>([]);
  proveedoresOptions = signal<Array<{label: string; value: number}>>([]);
  cargandoDatos = signal(false);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.cargarDatos();
        this.inicializarFormulario();
      }
    });
  }

  private cargarDatos() {
    this.cargandoDatos.set(true);

    this.obrasService.getObrasAll().subscribe({
      next: (obras) => {
        this.obrasOptions.set(
          obras.map(o => ({ label: o.nombre, value: o.id! }))
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar las obras'
        });
      }
    });

    this.clientesService.getClientes().subscribe({
      next: (clientes) => {
        this.clientesOptions.set(
          clientes.map(c => ({ label: c.nombre, value: c.id }))
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar los clientes'
        });
      }
    });

    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedoresOptions.set(
          proveedores.map(p => ({ label: p.nombre, value: p.id }))
        );
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudieron cargar los proveedores'
        });
      }
    });
  }

  private inicializarFormulario() {
    const agenda = this.agenda();
    this.esEdicion.set(!!agenda?.id);

    // Convertir fecha de ISO 8601 a formato YYYY-MM-DD para el input type="date"
    let fechaFormato: string | null = null;
    if (agenda?.fechaVencimiento) {
      const fecha = new Date(agenda.fechaVencimiento);
      fechaFormato = fecha.toISOString().split('T')[0];
    }

    this.form = this.fb.group({
      titulo: [agenda?.titulo || '', Validators.required],
      estado: [agenda?.estado || 'PENDIENTE'],
      obraId: [agenda?.obraId || null],
      clienteId: [agenda?.clienteId || null],
      proveedorId: [agenda?.proveedorId || null],
      descripcion: [agenda?.descripcion || ''],
      fechaVencimiento: [fechaFormato || null]
    });
  }

  guardar() {
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa los campos obligatorios'
      });
      return;
    }

    this.guardando.set(true);
    const formValue = this.form.value;

    // Convertir fecha de formato YYYY-MM-DD a ISO 8601 si existe
    if (formValue.fechaVencimiento) {
      const fecha = new Date(formValue.fechaVencimiento);
      formValue.fechaVencimiento = fecha.toISOString();
    }

    const agenda: Agenda = {
      ...formValue,
      id: this.agenda()?.id
    };

    const operacion = this.esEdicion()
      ? this.agendasService.actualizar(agenda.id!, agenda)
      : this.agendasService.crear(agenda);

    operacion.subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion() ? 'Tarea actualizada' : 'Tarea creada',
          detail: `La tarea "${resultado.titulo}" fue ${this.esEdicion() ? 'actualizada' : 'creada'} exitosamente`,
          life: 3000
        });
        this.onGuardada.emit(resultado);
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la tarea',
          life: 3000
        });
      }
    });
  }

  eliminar() {
    const agendaActual = this.agenda();
    if (!agendaActual?.id) return;

    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar esta tarea?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.guardando.set(true);
        this.agendasService.eliminar(agendaActual.id!).subscribe({
          next: () => {
            this.guardando.set(false);
            this.onEliminada.emit(agendaActual.id!);
          },
          error: () => {
            this.guardando.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la tarea'
            });
          }
        });
      }
    });
  }

  cerrar() {
    this.onClose.emit();
  }

  getEstadoLabel(estado: string): string {
    return ESTADOS_AGENDA_OPCIONES.find(e => e.name === estado)?.label || estado;
  }
}
