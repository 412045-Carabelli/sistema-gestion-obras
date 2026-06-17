import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { DashboardCuentaCorrienteResponse, ReportFilter } from '../../../../core/models/models';
import { Subscription } from 'rxjs';

/**
 * Componente independiente para los KPIs de cuenta corriente del dashboard.
 * Muestra: Cobrado, Por cobrar, Pagado, Por pagar, Resultado.
 * Se recarga automáticamente cuando cambian los filtros via ngOnChanges.
 */
@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  imports: [CommonModule, CardModule, CurrencyPipe],
  templateUrl: './dashboard-kpis.component.html',
  styleUrls: ['./dashboard-kpis.component.css']
})
export class DashboardKpisComponent implements OnInit, OnChanges, OnDestroy {

  @Input() filtros: ReportFilter = {};

  loading = false;
  datos: DashboardCuentaCorrienteResponse | null = null;
  private subs = new Subscription();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtros'] && !changes['filtros'].firstChange) {
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargar(): void {
    this.loading = true;
    this.subs.add(
      this.dashboardService.getCuentaCorriente(this.filtros).subscribe({
        next: (response) => {
          this.datos = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar KPIs del dashboard', err);
          this.loading = false;
        }
      })
    );
  }
}
