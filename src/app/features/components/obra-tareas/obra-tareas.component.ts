import {Component, Input} from '@angular/core';
import {NgIf, NgFor, CurrencyPipe, NgClass} from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

interface Tarea {
  id: number;
  nombre: string;
  completada: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
  tipo: string;
  tareas: Tarea[];
  tareasCompletadas: number;
  tareasTotales: number;
  progreso: number;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
  gastado: number;
}

@Component({
  selector: 'app-obra-tareas',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, ButtonModule, ProgressBarModule, NgClass],
  templateUrl: './obra-tareas.component.html',
})
export class ObraTareasComponent {
  proveedores: Proveedor[] = [
    {
      id: 1,
      nombre: 'Electricidad Córdoba SRL',
      tipo: 'Electricidad',
      tareas: [
        { id: 1, nombre: 'Instalación de tablero principal', completada: true },
        { id: 2, nombre: 'Cableado de circuitos de iluminación', completada: true },
        { id: 3, nombre: 'Cableado de circuitos de tomacorrientes', completada: true },
        { id: 4, nombre: 'Instalación de luminarias', completada: true },
        { id: 5, nombre: 'Pruebas finales y puesta en marcha', completada: false },
      ],
      tareasCompletadas: 4,
      tareasTotales: 5,
      progreso: 80,
      fechaInicio: '14/03/2024',
      fechaFin: '29/07/2024',
      presupuesto: 120000,
      gastado: 96000,
    },
  ];
  @Input() obraId!: number | undefined;

  toggleTarea(proveedorId: number, tareaId: number) {
    const proveedor = this.proveedores.find((p) => p.id === proveedorId);
    if (!proveedor) return;

    const tarea = proveedor.tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    tarea.completada = !tarea.completada;

    // Recalcular progreso
    proveedor.tareasCompletadas = proveedor.tareas.filter((t) => t.completada).length;
    proveedor.tareasTotales = proveedor.tareas.length;
    proveedor.progreso = Math.round(
      (proveedor.tareasCompletadas / proveedor.tareasTotales) * 100
    );

    // TODO: Llamada a API para actualizar estado de tarea
    // this.apiService.updateTarea(tarea.id, { completada: tarea.completada }).subscribe(...)
  }

  eliminarTarea(proveedorId: number, tareaId: number) {
    const proveedor = this.proveedores.find((p) => p.id === proveedorId);
    if (!proveedor) return;

    proveedor.tareas = proveedor.tareas.filter((t) => t.id !== tareaId);

    // Recalcular progreso
    proveedor.tareasCompletadas = proveedor.tareas.filter((t) => t.completada).length;
    proveedor.tareasTotales = proveedor.tareas.length;
    proveedor.progreso = proveedor.tareasTotales
      ? Math.round((proveedor.tareasCompletadas / proveedor.tareasTotales) * 100)
      : 0;

    // TODO: Llamada a API para eliminar tarea
    // this.apiService.deleteTarea(tareaId).subscribe(...)
  }
}
