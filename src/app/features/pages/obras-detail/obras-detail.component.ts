import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

import {Cliente, Obra, ObraCosto, Proveedor, Tarea} from '../../../core/models/models';
import { ObraMovimientosComponent } from '../../components/obra-movimientos/obra-movimientos.component';
import { ObraTareasComponent } from '../../components/obra-tareas/obra-tareas.component';
import { ObraPresupuestoComponent } from '../../components/obra-presupuesto/obra-presupuesto.component';
import { ObraReportComponent } from '../../components/obra-report/obra-report.component';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TabViewModule,
    ProgressBarModule,
    TooltipModule,
    ObraMovimientosComponent,
    ObraTareasComponent,
    ObraPresupuestoComponent,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './obras-detail.component.html',
  styleUrls: ['./obras-detail.component.css']
})
export class ObrasDetailComponent implements OnInit {
  obra!: Obra;

  tareas: Tarea[] = [
    { id_tarea: 1, id_obra: 1, id_proveedor: 1, id_estado_tarea: 2, nombre: 'Cimientos', activo: true },
    { id_tarea: 2, id_obra: 1, id_proveedor: 2, id_estado_tarea: 2, nombre: 'Levantamiento paredes', activo: true },
    { id_tarea: 3, id_obra: 1, id_proveedor: 3, id_estado_tarea: 1, nombre: 'Colocación techos', activo: true },
    { id_tarea: 4, id_obra: 1, id_proveedor: 4, id_estado_tarea: 1, nombre: 'Instalaciones eléctricas', activo: true }
  ];

  proveedores: Proveedor[] = [
    { id_proveedor: 1, id_tipo_proveedor: 1, nombre: 'Proveedor A', activo: true },
    { id_proveedor: 2, id_tipo_proveedor: 1, nombre: 'Proveedor B', activo: true },
    { id_proveedor: 3, id_tipo_proveedor: 1, nombre: 'Proveedor C', activo: true },
    { id_proveedor: 4, id_tipo_proveedor: 1, nombre: 'Proveedor D', activo: true }
  ];

  ngOnInit(): void {
    this.cargarMockObra();
  }

  private cargarMockObra() {
    const cliente: Cliente = {
      id_cliente: 1,
      nombre: 'Rodriguez S.A.',
      contacto: 'Juan Perez',
      telefono: '351-555-1212',
      email: 'contacto@rodriguezsa.com',
      activo: true
    };

    const costos: ObraCosto[] = [
      {
        id_obra_costo: 1,
        descripcion: 'Albañilería',
        id_obra: 1,
        unidad: 'jornales',
        cantidad: 20,
        precio_unitario: 15000,
        iva: 21,
        subtotal: 300000,
        total: 363000,
        activo: true
      },
      {
        id_obra_costo: 2,
        descripcion: 'Hormigón elaborado H21',
        id_obra: 1,
        unidad: 'm3',
        cantidad: 15,
        precio_unitario: 32000,
        iva: 21,
        subtotal: 480000,
        total: 580800,
        activo: true
      }
    ];

    this.obra = {
      id_obra: 1,
      nombre: 'Casa Familia Rodriguez',
      direccion: 'Av. San Martín 1234, Córdoba',
      id_cliente: cliente.id_cliente,
      id_estado_obra: 1,
      fecha_inicio: '2024-01-29',
      fecha_fin: '2024-12-30',
      fecha_adjudicada: '2024-01-15',
      fecha_perdida: undefined,
      presupuesto: 850000,
      gastado: 638000,
      activo: true
    };

  }

  onTareasActualizadas(tareas: Tarea[]) {
    this.tareas = tareas;
  }

  getProgresoFinanciero(): number {
    return this.obra?.presupuesto
      ? Math.round(((this.obra.gastado ?? 0) / this.obra.presupuesto) * 100)
      : 0;
  }

  getProgresoFisico(): number {
    if (!this.tareas.length) return 0;
    // supongamos: estado 2 = completada, estado 1 = pendiente
    const completadas = this.tareas.filter(t => t.id_estado_tarea === 2).length;
    return Math.round((completadas / this.tareas.length) * 100);
  }
}
