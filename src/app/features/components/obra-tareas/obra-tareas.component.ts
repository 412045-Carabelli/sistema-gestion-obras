import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DropdownModule } from 'primeng/dropdown';
import { Proveedor, Tarea } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/modal/modal.component';
import {InputText} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-obra-tareas',
  standalone: true,
  imports: [
    NgClass,
    ButtonModule, ProgressBarModule, DropdownModule,
    ModalComponent, InputText, FormsModule
  ],
  templateUrl: './obra-tareas.component.html',
})
export class ObraTareasComponent {
  @Input() proveedores: Proveedor[] = [];
  @Input() tareas: Tarea[] = [];

  /** Notifica al padre (ObrasDetailComponent) para que actualice el progreso físico */
  @Output() tareasActualizadas = new EventEmitter<Tarea[]>();

  // --- Modal control ---
  showAddTaskModal = false;
  nuevaTarea: Partial<Tarea> = { nombre: '', id_proveedor: undefined };

  abrirModal() {
    this.nuevaTarea = {
      nombre: '',
      id_proveedor: this.proveedores[0]?.id_proveedor
    };
    this.showAddTaskModal = true;
  }

  cerrarModal() {
    this.showAddTaskModal = false;
  }

  guardarTarea() {
    if (!this.nuevaTarea.nombre || !this.nuevaTarea.id_proveedor) return;

    const newId = this.tareas.length
      ? Math.max(...this.tareas.map(t => t.id_tarea)) + 1
      : 1;

    const nueva: Tarea = {
      id_tarea: newId,
      id_obra: this.tareas[0]?.id_obra ?? 1,  // o id de la obra actual
      id_proveedor: this.nuevaTarea.id_proveedor!,
      id_estado_tarea: 1, // pendiente
      nombre: this.nuevaTarea.nombre!,
      activo: true
    };

    // Crear NUEVO arreglo (inmutabilidad) para gatillar CD y emitir al padre
    this.tareas = [...this.tareas, nueva];
    this.emitirCambios();
    this.showAddTaskModal = false;
  }

  // --- Métodos auxiliares ---
  getTareasByProveedor(proveedorId: number): Tarea[] {
    return this.tareas.filter(t => t.id_proveedor === proveedorId);
  }

  getCompletadas(proveedorId: number): number {
    return this.getTareasByProveedor(proveedorId).filter(t => t.id_estado_tarea === 3).length;
  }

  getTotales(proveedorId: number): number {
    return this.getTareasByProveedor(proveedorId).length;
  }

  getProgresoProveedor(proveedorId: number): number {
    const tareas = this.getTareasByProveedor(proveedorId);
    if (!tareas.length) return 0;
    const completadas = tareas.filter(t => t.id_estado_tarea === 3).length;
    return Math.round((completadas / tareas.length) * 100);
  }

  getEstadoClass(tarea: Tarea): string {
    switch (tarea.id_estado_tarea) {
      case 3: return 'bg-green-50 border-green-200';
      case 2: return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  }

  toggleTarea(tarea: Tarea) {
    const nuevoEstado = tarea.id_estado_tarea === 3 ? 1 : 3;
    // Inmutabilidad: crear nuevo array con la tarea actualizada
    this.tareas = this.tareas.map(t =>
      t.id_tarea === tarea.id_tarea ? { ...t, id_estado_tarea: nuevoEstado } : t
    );
    this.emitirCambios();
  }

  eliminarTarea(tareaId: number) {
    // Inmutabilidad + emitir
    this.tareas = this.tareas.filter(t => t.id_tarea !== tareaId);
    this.emitirCambios();
  }

  private emitirCambios() {
    // Emitimos una copia para evitar mutaciones externas
    this.tareasActualizadas.emit([...this.tareas]);
  }
}
