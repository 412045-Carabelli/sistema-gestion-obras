import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReportesService } from '../../../../services/reportes/reportes.service';
import { DashboardGraficosResponse } from '../../../../core/models/models';
import { Subscription } from 'rxjs';

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ADJUDICADA: 'Adjudicada',
  EN_PROGRESO: 'En progreso',
  COBRADA: 'Cobrada',
  FACTURADA: 'Facturada',
  FACTURADA_PARCIAL: 'Facturada parcial',
  FINALIZADA: 'Finalizada',
  PERDIDA: 'Perdida',
  CANCELADA: 'Cancelada',
  SIN_ESTADO: 'Sin estado',
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:         '#94a3b8', // gray-400
  ADJUDICADA:        '#60a5fa', // blue-400
  EN_PROGRESO:       '#f59e0b', // amber-400
  COBRADA:           '#10b981', // emerald-500
  FACTURADA:         '#6366f1', // indigo-500
  FACTURADA_PARCIAL: '#a78bfa', // violet-400
  FINALIZADA:        '#059669', // emerald-600
  PERDIDA:           '#f87171', // red-400
  CANCELADA:         '#9ca3af', // gray-400
  SIN_ESTADO:        '#e5e7eb', // gray-200
};

@Component({
  selector: 'app-dashboard-graficos',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule],
  templateUrl: './dashboard-graficos.component.html',
  styleUrls: ['./dashboard-graficos.component.css']
})
export class DashboardGraficosComponent implements OnInit, OnDestroy {

  loading = false;
  datos: DashboardGraficosResponse | null = null;

  pieData: any = null;
  pieOptions: any = null;
  barData: any = null;
  barOptions: any = null;

  private subs = new Subscription();

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargar(): void {
    this.loading = true;
    this.subs.add(
      this.reportesService.getDashboardGraficos().subscribe({
        next: (data) => {
          this.datos = data;
          this.construirPie(data);
          this.construirBar(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar gráficos del dashboard', err);
          this.loading = false;
        }
      })
    );
  }

  private construirPie(data: DashboardGraficosResponse): void {
    const estados = data.distribucionEstados ?? [];
    this.pieData = {
      labels: estados.map(e => ESTADO_LABELS[e.estado] ?? e.estado),
      datasets: [{
        data: estados.map(e => e.cantidad),
        backgroundColor: estados.map(e => ESTADO_COLORS[e.estado] ?? '#94a3b8'),
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    };
    this.pieOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Poppins', size: 12 }, padding: 16, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const total = estados.reduce((s, e) => s + e.cantidad, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
              return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    };
  }

  private construirBar(data: DashboardGraficosResponse): void {
    const obras = data.topObras ?? [];
    const labels = obras.map(o => o.obraNombre.length > 22 ? o.obraNombre.substring(0, 20) + '…' : o.obraNombre);
    this.barData = {
      labels,
      datasets: [
        {
          label: 'Presupuesto',
          data: obras.map(o => o.presupuesto ?? 0),
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Cobrado',
          data: obras.map(o => o.totalCobros ?? 0),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Pagado',
          data: obras.map(o => o.totalPagos ?? 0),
          backgroundColor: 'rgba(245, 158, 11, 0.75)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ]
    };
    this.barOptions = {
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Poppins', size: 12 }, padding: 12, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const val: number = ctx.parsed.y ?? 0;
              return ` ${ctx.dataset.label}: $${val.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { font: { family: 'Poppins', size: 11 } },
          grid: { display: false }
        },
        y: {
          ticks: {
            font: { family: 'Poppins', size: 11 },
            callback: (v: any) => '$' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0 })
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        }
      }
    };
  }
}
