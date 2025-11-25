import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {ProgressBarModule} from 'primeng/progressbar';
import {DropdownModule} from 'primeng/dropdown';
import {ToastModule} from 'primeng/toast'; // 👈 importar módulo
import {MessageService} from 'primeng/api'; // 👈 importar servicio
import {FormsModule} from '@angular/forms';
import {EstadoTarea, Proveedor, Tarea} from '../../../core/models/models';
import {ModalComponent} from '../../../shared/modal/modal.component';
import {TareaPayload, TareasService} from '../../../services/tareas/tareas.service';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-obra-tareas',
  standalone: true,
  imports: [
    NgClass,
    ButtonModule,
    ProgressBarModule,
    DropdownModule,
    ToastModule,                // 👈 aquí también
    ModalComponent,
    FormsModule,
    InputText,
    Select
  ],
  providers: [MessageService],  // 👈 importante para usar el toast
  templateUrl: './obra-tareas.component.html',
})
export class ObraTareasComponent {
  @Input() obraId!: number;
  @Input() proveedores: Proveedor[] = [];
  @Input() tareas: Tarea[] = [];
  @Input() obraNombre = '';
  @Output() tareasActualizadas = new EventEmitter<Tarea[]>();

  showAddTaskModal = false;
  editandoTarea: Tarea | null = null;
  nuevaTarea: Partial<Tarea> = {};

  constructor(
    private tareasService: TareasService,
    private messageService: MessageService   // 👈 inyectar servicio
  ) {
  }

  abrirModal() {
    this.nuevaTarea = {
      proveedor: this.proveedores[0] ?? null,
      estado_tarea: 'PENDIENTE'
    };
    this.editandoTarea = null;
    this.showAddTaskModal = true;
  }

  cerrarModal() {
    this.showAddTaskModal = false;
    this.editandoTarea = null;
  }

  guardarTarea() {
    if (!this.nuevaTarea.nombre || !this.nuevaTarea.proveedor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Debe ingresar un nombre y un proveedor'
      });
      return;
    }

    const payload: TareaPayload = {
      id: this.editandoTarea?.id,
      id_obra: this.obraId,
      id_proveedor: this.nuevaTarea.proveedor.id!,
      estado_tarea: this.nuevaTarea.estado_tarea || 'PENDIENTE',
      nombre: this.nuevaTarea.nombre!,
      descripcion: this.nuevaTarea.descripcion
    };

    const request$ = this.editandoTarea?.id
      ? this.tareasService.updateTarea(this.editandoTarea.id, payload)
      : this.tareasService.createTarea(payload);

    request$.subscribe({
      next: (created) => {
        if (this.editandoTarea?.id) {
          this.tareas = this.tareas.map(t => t.id === created.id ? {
            ...t,
            ...created,
            proveedor: this.nuevaTarea.proveedor!
          } : t);
        } else {
          this.tareas = [...this.tareas, {
            ...created,
            proveedor: this.nuevaTarea.proveedor!,
          }];
        }

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
      next: (updated) => {
        console.log(updated)
        this.tareas = this.tareas.map(t => t.id === tarea.id ? {...t, ...updated} : t);
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
          detail: 'La tarea fue eliminada correctamente 🗑️'
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

  tareasProveedor(pid: number) {
    return this.tareas.filter(t => t.proveedor?.id === pid);
  }

  progreso(pid: number) {
    const tareasProv = this.tareasProveedor(pid);
    if (!tareasProv.length) return 0;
    const completadas = tareasProv.filter(t => t.estado_tarea === "EN PROGRESO").length;
    return Math.round((completadas / tareasProv.length) * 100);
  }

  getCompletadas(pid: number): number {
    return this.tareasProveedor(pid).filter(t => t.estado_tarea === "COMPLETADA").length;
  }

  getTotales(pid: number): number {
    return this.tareasProveedor(pid).length;
  }

  claseEstado(tarea: Tarea) {
    switch (tarea.estado_tarea) {
      case "COMPLETADA":
        return 'bg-green-50 border-green-200';
      case "PENDIENTE":
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  }

  editarTarea(tarea: Tarea) {
    this.editandoTarea = tarea;
    this.nuevaTarea = {
      id: tarea.id,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      estado_tarea: tarea.estado_tarea,
      proveedor: tarea.proveedor,
    };
    this.showAddTaskModal = true;
  }
}
