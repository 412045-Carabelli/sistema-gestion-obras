import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DropdownModule} from 'primeng/dropdown';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {Tooltip} from 'primeng/tooltip';

import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';
import {EstadoTarea, Proveedor, Tarea} from '../../../core/models/models';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {TareaPayload, TareasService} from '../../../services/tareas/tareas.service';

@Component({
  selector: 'app-obra-tareas',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    ButtonModule,
    DropdownModule,
    ToastModule,
    ModalComponent,
    FormsModule,
    InputText,
    Select,
    TagModule,
    TableModule,
    Tooltip,
    EstadoFormatPipe
  ],
  providers: [MessageService],
  templateUrl: './obra-tareas.component.html'
})
export class ObraTareasComponent {
  @Input() obraId!: number;
  @Input() proveedores: Proveedor[] = [];
  @Input() tareas: Tarea[] = [];
  @Input() obraNombre = '';
  @Output() tareasActualizadas = new EventEmitter<Tarea[]>();

  estadoOptions = [
    {label: 'Pendiente', value: 'PENDIENTE'},
    {label: 'En progreso', value: 'EN_PROGRESO'},
    {label: 'Completada', value: 'COMPLETADA'}
  ];

  showAddTaskModal = false;
  editandoTarea: Tarea | null = null;
  nuevaTarea: Partial<Tarea> = {};
  camposDeshabilitados = false;

  constructor(
    private tareasService: TareasService,
    private messageService: MessageService
  ) {}

  abrirModal() {
    this.nuevaTarea = {
      proveedor: this.proveedores[0] ?? null,
      id_proveedor: this.proveedores[0]?.id,
      estado_tarea: 'PENDIENTE',
      porcentaje: 0,
      fecha_inicio: new Date().toISOString().slice(0, 10)
    };
    this.editandoTarea = null;
    this.camposDeshabilitados = false;
    this.showAddTaskModal = true;
  }

  cerrarModal() {
    this.showAddTaskModal = false;
    this.editandoTarea = null;
  }

  habilitarEdicion() {
    this.camposDeshabilitados = false;
  }

  guardarTarea() {
    this.camposDeshabilitados = false;
    if (!this.nuevaTarea.nombre || !this.nuevaTarea.id_proveedor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Debe ingresar un nombre y un proveedor'
      });
      return;
    }

    const nuevoPorcentaje = Number(this.nuevaTarea.porcentaje ?? 0);
    if (Number.isNaN(nuevoPorcentaje) || nuevoPorcentaje < 0 || nuevoPorcentaje > 100) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Porcentaje inválido',
        detail: 'El porcentaje debe estar entre 0 y 100'
      });
      return;
    }

    if (!this.validarTopePorcentaje(nuevoPorcentaje, this.editandoTarea?.id)) {
      return;
    }

    const proveedorSeleccionado = this.proveedores.find(p => Number(p.id) === Number(this.nuevaTarea.id_proveedor));

    const payload: TareaPayload = {
      id: this.editandoTarea?.id,
      id_obra: this.obraId,
      id_proveedor: Number(this.nuevaTarea.id_proveedor),
      estado_tarea: this.nuevaTarea.estado_tarea || 'PENDIENTE',
      nombre: this.nuevaTarea.nombre!,
      descripcion: this.nuevaTarea.descripcion,
      porcentaje: nuevoPorcentaje,
      fecha_inicio: this.normalizarFecha(this.nuevaTarea.fecha_inicio)
    };

    const request$ = this.editandoTarea?.id
      ? this.tareasService.updateTarea(this.editandoTarea.id, payload)
      : this.tareasService.createTarea(payload);

    request$.subscribe({
      next: created => {
        if (this.editandoTarea?.id) {
          this.tareas = this.tareas.map(t =>
            t.id === created.id
              ? {...t, ...created, proveedor: proveedorSeleccionado ?? t.proveedor}
              : t
          );
        } else {
          this.tareas = [
            ...this.tareas,
            {...created, proveedor: proveedorSeleccionado ?? this.nuevaTarea.proveedor ?? undefined}
          ];
        }

        this.tareas = this.ordenarCronologicamente(this.tareas);
        this.tareasActualizadas.emit(this.tareas);
        this.showAddTaskModal = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la tarea'
        });
      }
    });
  }

  toggleTarea(tarea: Tarea) {
    this.tareasService.completarTarea(tarea.id!, this.obraId).subscribe({
      next: updated => {
        this.tareas = this.tareas.map(t =>
          t.id === tarea.id ? {...t, ...updated} : t
        );
        this.tareasActualizadas.emit(this.tareas);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la tarea'
        });
      }
    });
  }

  eliminarTarea(id: number) {
    this.tareasService.deleteTarea(id, this.obraId).subscribe({
      next: () => {
        this.tareas = this.tareas.filter(t => t.id !== id);
        this.tareasActualizadas.emit(this.tareas);
        this.messageService.add({
          severity: 'success',
          summary: 'Tarea eliminada',
          detail: 'La tarea fue eliminada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la tarea'
        });
      }
    });
  }

  claseEstado(tarea: Tarea) {
    switch (tarea.estado_tarea) {
      case 'COMPLETADA':
        return 'bg-green-50 border-green-200';
      case 'PENDIENTE':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  }

  editarTarea(tarea: Tarea) {
    this.editandoTarea = tarea;
    const prov = tarea.proveedor || this.proveedores.find(p => Number(p.id) === Number(tarea.id_proveedor)) || undefined;
    this.nuevaTarea = {
      id: tarea.id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      estado_tarea: tarea.estado_tarea,
      proveedor: prov,
      id_proveedor: prov?.id ?? tarea.id_proveedor,
      porcentaje: tarea.porcentaje ?? 0,
      fecha_inicio: tarea.fecha_inicio ? tarea.fecha_inicio.slice(0, 10) : new Date().toISOString().slice(0, 10)
    };
    this.camposDeshabilitados = false;
    this.showAddTaskModal = true;
  }

  verTarea(tarea: Tarea) {
    this.editandoTarea = tarea;
    const prov = tarea.proveedor || this.proveedores.find(p => Number(p.id) === Number(tarea.id_proveedor)) || undefined;
    this.nuevaTarea = {
      id: tarea.id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      estado_tarea: tarea.estado_tarea,
      proveedor: prov,
      id_proveedor: prov?.id ?? tarea.id_proveedor,
      porcentaje: tarea.porcentaje ?? 0,
      fecha_inicio: tarea.fecha_inicio ? tarea.fecha_inicio.slice(0, 10) : undefined
    };
    this.camposDeshabilitados = true;
    this.showAddTaskModal = true;
  }

  marcarEnProgreso(tarea: Tarea) {
    const payload: TareaPayload = {
      id: tarea.id,
      id_obra: this.obraId,
      id_proveedor: tarea.id_proveedor || tarea.proveedor?.id!,
      estado_tarea: 'EN_PROGRESO',
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      porcentaje: tarea.porcentaje ?? 0,
      fecha_inicio: this.normalizarFecha(tarea.fecha_inicio)
    };
    this.tareasService.updateTarea(tarea.id!, payload).subscribe({
      next: updated => {
        this.tareas = this.ordenarCronologicamente(
          this.tareas.map(t => (t.id === tarea.id ? {...t, ...updated, proveedor: t.proveedor} : t))
        );
        this.tareasActualizadas.emit(this.tareas);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo marcar la tarea en progreso'
        });
      }
    });
  }

  ordenarCronologicamente(lista: Tarea[]): Tarea[] {
    return [...lista].sort((a, b) => {
      const fa = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
      const fb = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
      if (fa === fb) return (a.creado_en ? new Date(a.creado_en).getTime() : 0) - (b.creado_en ? new Date(b.creado_en).getTime() : 0);
      return fa - fb;
    });
  }

  private totalPorcentajeSin(id?: number): number {
    return this.tareas
      .filter(t => t.id !== id)
      .reduce((acc, t) => acc + Number(t.porcentaje ?? 0), 0);
  }

  private validarTopePorcentaje(nuevo: number, idActual?: number): boolean {
    const total = this.totalPorcentajeSin(idActual) + nuevo;
    if (total > 100 + 1e-6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Límite de porcentaje',
        detail: 'La suma de porcentajes no puede superar 100%'
      });
      return false;
    }
    return true;
  }

  private normalizarFecha(fecha?: string | null): string | undefined {
    if (!fecha) return undefined;
    // si ya viene con hora, se deja
    if (fecha.includes('T')) return fecha;
    return `${fecha}T00:00:00`;
  }
}
