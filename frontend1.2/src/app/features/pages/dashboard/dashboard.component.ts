import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import {FlujoCajaResponse, MovimientoDashboard, ResumenGeneralResponse, Tarea} from '../../../core/models/models';
import {TareasService} from '../../../services/tareas/tareas.service';
import {ReportesService} from '../../../services/reportes/reportes.service';
import {TransaccionesService} from '../../../services/transacciones/transacciones.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {EstadoFormatPipe} from '../../../shared/pipes/estado-format.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Toast,
    ProgressSpinnerModule,
    Button,
    EstadoFormatPipe
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Estados de carga
  loadingGeneral = true;

  // Datos principales
  resumenGeneral!: ResumenGeneralResponse;
  flujoCaja!: FlujoCajaResponse;
  tareasRecientes: Tarea[] = [];
  movimientosRecientes: MovimientoDashboard[] = [];
  conteoObras = {
    total: 0,
    cotizadas: 0,
    perdidas: 0,
    adjudicadas: 0,
    activas: 0,
    finalizadas: 0,
  };

  constructor(
    private router: Router,
    private reportesService: ReportesService,
    private tareasService: TareasService,
    private transaccionesService: TransaccionesService,
    private obrasService: ObrasService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  private cargarDashboard(): void {
    this.loadingGeneral = true;

    // Cargar datos principales en paralelo
    forkJoin({
      resumen: this.reportesService.getResumenGeneral(),
      flujo: this.reportesService.getFlujoCaja(),
      obras: this.obrasService.getObras()
    }).subscribe({
      next: ({ resumen, flujo, obras }) => {
        this.resumenGeneral = resumen;
        this.flujoCaja = flujo;
        this.conteoObras = this.calcularConteosObras(obras);

        // Cargar tareas de las últimas 3 obras
        const obrasRecientes = obras.slice(0, 3);
        const tareasPromises = obrasRecientes.map(obra =>
          this.tareasService.getTareasByObra(obra.id!)
        );

        if (tareasPromises.length > 0) {
          forkJoin(tareasPromises).subscribe({
            next: (tareasPorObra) => {
              // Aplanar y ordenar por más recientes
              const mapaObras = new Map(obrasRecientes.map(o => [o.id, o.nombre]));
              this.tareasRecientes = ([] as (Tarea & { obraNombre?: string })[])
                .concat(...tareasPorObra)
                .map(t => ({
                  ...t,
                  obraNombre: mapaObras.get(t.id_obra) || 'Obra sin nombre'
                }))
                .sort((a, b) => (b.id || 0) - (a.id || 0));
            }
          });
        }

        // Cargar movimientos recientes (últimos movimientos del flujo de caja)
        this.movimientosRecientes = (flujo.movimientos || [])
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 10);

        this.loadingGeneral = false;
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        this.loadingGeneral = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del dashboard'
        });
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private calcularConteosObras(obras: { obra_estado: string }[]): typeof this.conteoObras {
    const normalizar = (estado: string | undefined | null) => (estado || '').toUpperCase();
    return obras.reduce((acc, obra) => {
      const estado = normalizar((obra as any).obra_estado);
      acc.total += 1;
      if (estado.includes('COTIZ')) acc.cotizadas += 1;
      if (estado.includes('PERDID')) acc.perdidas += 1;
      if (estado.includes('ADJUDIC')) acc.adjudicadas += 1;
      if (estado.includes('ACTIV')) acc.activas += 1;
      if (estado.includes('FINALIZ')) acc.finalizadas += 1;
      return acc;
    }, { ...this.conteoObras });
  }
}
