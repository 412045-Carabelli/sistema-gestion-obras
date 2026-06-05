import {Component, Input, Output, EventEmitter, signal, effect, inject, input, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextarea} from 'primeng/inputtextarea';
import {DropdownModule} from 'primeng/dropdown';
import {MessageService, ConfirmationService} from 'primeng/api';
import {ModalComponent} from '../../../../shared/modal/modal.component';

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
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    ModalComponent
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
  obrasMap = signal<Map<number, Obra>>(new Map());
  clientesOptions = signal<Array<{label: string; value: number}>>([]);
  proveedoresOptions = signal<Array<{label: string; value: number}>>([]);
  clientesFiltrados = computed(() => {
    const obraId = this.form?.get('obraId')?.value;
    if (!obraId) return this.clientesOptions();

    const obra = this.obrasMap().get(obraId);
    if (!obra || !obra.cliente) return [];

    return this.clientesOptions().filter(c => c.value === obra.cliente.id);
  });
  proveedoresFiltrados = computed(() => {
    const obraId = this.form?.get('obraId')?.value;
    if (!obraId) return this.proveedoresOptions();

    return this.proveedoresOptions();
  });
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
        const map = new Map<number, Obra>();
        obras.forEach(o => map.set(o.id!, o));
        this.obrasMap.set(map);
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

    let fechaInicioFormato: string | null = null;
    let fechaVencimientoFormato: string | null = null;

    if (agenda?.fechaInicio) {
      const fecha = new Date(agenda.fechaInicio);
      fechaInicioFormato = fecha.toISOString().split('T')[0];
    } else if (!agenda?.id) {
      // Alta nueva: default hoy (fecha local, no UTC)
      const hoy = new Date();
      const y = hoy.getFullYear();
      const m = String(hoy.getMonth() + 1).padStart(2, '0');
      const d = String(hoy.getDate()).padStart(2, '0');
      fechaInicioFormato = `${y}-${m}-${d}`;
    }

    if (agenda?.fechaVencimiento) {
      const fecha = new Date(agenda.fechaVencimiento);
      fechaVencimientoFormato = fecha.toISOString().split('T')[0];
    }

    this.form = this.fb.group({
      titulo: [agenda?.titulo || '', Validators.required],
      estado: [agenda?.estado || 'PENDIENTE'],
      obraId: [agenda?.obraId || null],
      clienteId: [agenda?.clienteId || null],
      proveedorId: [agenda?.proveedorId || null],
      descripcion: [agenda?.descripcion || ''],
      fechaInicio: [fechaInicioFormato || null],
      fechaVencimiento: [fechaVencimientoFormato || null]
    }, { validators: this.validadorFechas() });
  }

  private validadorFechas() {
    return (group: AbstractControl): ValidationErrors | null => {
      const fechaInicio = group.get('fechaInicio')?.value;
      const fechaVencimiento = group.get('fechaVencimiento')?.value;

      if (fechaInicio && fechaVencimiento) {
        const inicio = new Date(fechaInicio).getTime();
        const vencimiento = new Date(fechaVencimiento).getTime();

        if (vencimiento < inicio) {
          group.get('fechaVencimiento')?.setErrors({ fechaMenorQueInicio: true });
          return { fechaMenorQueInicio: true };
        } else {
          const errors = group.get('fechaVencimiento')?.errors;
          if (errors) {
            delete errors['fechaMenorQueInicio'];
            if (Object.keys(errors).length === 0) {
              group.get('fechaVencimiento')?.setErrors(null);
            }
          }
        }
      }
      return null;
    };
  }

  onObraChange() {
    const obraId = this.form.get('obraId')?.value;
    if (obraId) {
      this.form.patchValue({ clienteId: null, proveedorId: null });
      const obra = this.obrasMap().get(obraId);
      if (obra?.cliente) {
        this.form.patchValue({ clienteId: obra.cliente.id });
      }
    } else {
      this.form.patchValue({ clienteId: null, proveedorId: null });
    }
  }

  guardar() {
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa los campos obligatorios y verifica las fechas'
      });
      return;
    }

    this.guardando.set(true);
    const formValue = this.form.value;

    if (formValue.fechaInicio) {
      const fecha = new Date(formValue.fechaInicio);
      formValue.fechaInicio = fecha.toISOString();
    }

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
