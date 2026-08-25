import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReportesService } from '../../../../services/reportes/reportes.service';
import { DashboardGraficosResponse } from '../../../../core/models/models';
import { Subscription } from 'rxjs';
import { CHART_CATEGORICAL, chartFont, chartLegend, chartMoneyScale, chartCategoryScale, formatARSCompact } from '../../../../shared/chart-theme/chart-theme';

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

// Orden categórico fijo (nunca ciclar/regenerar) — cada estado toma el siguiente slot disponible.
const ESTADO_ORDEN = [
  'EN_PROGRESO', 'ADJUDICADA', 'FINALIZADA', 'FACTURADA', 'COBRADA',
  'FACTURADA_PARCIAL', 'PENDIENTE', 'PERDIDA', 'CANCELADA', 'SIN_ESTADO'
];

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

  private colorEstado(estado: string): string {
    const idx = ESTADO_ORDEN.indexOf(estado);
    return CHART_CATEGORICAL[idx >= 0 ? idx % CHART_CATEGORICAL.length : CHART_CATEGORICAL.length - 1];
  }

  private construirPie(data: DashboardGraficosResponse): void {
    const estados = data.distribucionEstados ?? [];
    this.pieData = {
      labels: estados.map(e => ESTADO_LABELS[e.estado] ?? e.estado),
      datasets: [{
        data: estados.map(e => e.cantidad),
        backgroundColor: estados.map(e => this.colorEstado(e.estado)),
        borderColor: '#fcfcfb',
        borderWidth: 2,
      }]
    };
    this.pieOptions = {
      plugins: {
        legend: chartLegend('bottom'),
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0b0b0b',
          bodyColor: '#52514e',
          borderColor: '#e1e0d9',
          borderWidth: 1,
          titleFont: chartFont(12, '600'),
          bodyFont: chartFont(12),
          padding: 10,
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
          backgroundColor: CHART_CATEGORICAL[0],
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 22,
        },
        {
          label: 'Cobrado',
          data: obras.map(o => o.totalCobros ?? 0),
          backgroundColor: CHART_CATEGORICAL[1],
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 22,
        },
        {
          label: 'Pagado',
          data: obras.map(o => o.totalPagos ?? 0),
          backgroundColor: CHART_CATEGORICAL[2],
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 22,
        },
      ]
    };
    this.barOptions = {
      plugins: {
        legend: chartLegend('top'),
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0b0b0b',
          bodyColor: '#52514e',
          borderColor: '#e1e0d9',
          borderWidth: 1,
          titleFont: chartFont(12, '600'),
          bodyFont: chartFont(12),
          padding: 10,
          callbacks: {
            label: (ctx: any) => ` ${ctx.dataset.label}: ${formatARSCompact(ctx.parsed.y)}`
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: chartCategoryScale(), y: chartMoneyScale() }
    };
  }
}
