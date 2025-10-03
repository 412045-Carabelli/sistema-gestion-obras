import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

import { Cliente, Obra, ObraCosto } from '../../../core/models/models';
import { ObraMovimientosComponent } from '../../components/obra-movimientos/obra-movimientos.component';
import { ObraTareasComponent } from '../../components/obra-tareas/obra-tareas.component';
import { ObraPresupuestoComponent } from '../../components/obra-presupuesto/obra-presupuesto.component';
import { ObraReportComponent } from '../../components/obra-report/obra-report.component';

@Component({
  selector: 'app-obra-detail',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    ButtonModule,
    CardModule,
    TabViewModule,
    ProgressBarModule,
    TooltipModule,
    ObraMovimientosComponent,
    ObraTareasComponent,
    ObraPresupuestoComponent,
    ObraReportComponent,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './obras-detail.component.html',
  styleUrls: ['./obras-detail.component.css']
})
export class ObrasDetailComponent implements OnInit {
  obra!: Obra;

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

  getProgresoFinanciero(): number {
    return this.obra?.presupuesto
      ? ((this.obra.gastado ?? 0) / this.obra.presupuesto) * 100
      : 0;
  }

  getProgresoFisico(): number {
    return 70; // Mock
  }
}
