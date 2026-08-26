import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReportesService } from '../../../../services/reportes/reportes.service';
import { DashboardGraficosResponse, DeudasGlobalesResponse } from '../../../../core/models/models';
import { Subscription, forkJoin } from 'rxjs';
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
      forkJoin({
        graficos: this.reportesService.getDashboardGraficos(),
        deudas: this.reportesService.getDeudasGlobales()
      }).subscribe({
        next: ({ graficos, deudas }) => {
          this.datos = graficos;
          this.construirPie(graficos);
          this.construirBar(deudas);
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

  private construirBar(deudas: DeudasGlobalesResponse): void {
    const saldoPorCliente = new Map<number, { nombre: string; saldo: number }>();
    for (const d of deudas.detalleDeudaClientes ?? []) {
      const id = d.clienteId ?? 0;
      if (!id) continue;
      const acumulado = saldoPorCliente.get(id);
      const nombre = d.clienteNombre || `Cliente #${id}`;
      saldoPorCliente.set(id, { nombre, saldo: (acumulado?.saldo ?? 0) + (d.saldo ?? 0) });
    }

    const top5 = Array.from(saldoPorCliente.values())
      .filter(c => c.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 5);

    const labels = top5.map(c => c.nombre.length > 22 ? c.nombre.substring(0, 20) + '…' : c.nombre);
    this.barData = {
      labels,
      datasets: [
        {
          label: 'Saldo pendiente',
          data: top5.map(c => c.saldo),
          backgroundColor: CHART_CATEGORICAL[7],
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 22,
        },
      ]
    };
    this.barOptions = {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
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
            label: (ctx: any) => ` ${formatARSCompact(ctx.parsed.x)}`
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: chartMoneyScale('x'), y: chartCategoryScale() }
    };
  }
}
