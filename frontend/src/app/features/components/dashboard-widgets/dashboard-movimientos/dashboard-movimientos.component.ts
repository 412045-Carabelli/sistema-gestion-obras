import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ReportFilter, MovimientoRecenteDTO } from '../../../../core/models/models';
import { Subscription } from 'rxjs';

/**
 * Componente independiente para últimos movimientos del dashboard.
 * Se recarga automáticamente cuando cambian los filtros via ngOnChanges.
 */
@Component({
  selector: 'app-dashboard-movimientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-movimientos.component.html',
  styleUrls: ['./dashboard-movimientos.component.css']
})
export class DashboardMovimientosComponent implements OnInit, OnChanges, OnDestroy {

  @Input() filtros: ReportFilter = {};

  loading = false;
  movimientos: MovimientoRecenteDTO[] = [];
  private subs = new Subscription();
  private apiUrl = `${environment.apiGateway}/bff/reportes/movimientos/recientes`;

  constructor(private http: HttpClient, private router: Router) {}

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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navegarAMovimientosObra(obraId: number | undefined): void {
    if (!obraId) return;
    this.router.navigate(['/obras', obraId], { queryParams: { tab: '2' } });
  }

  getAsociadoNombre(mov: MovimientoRecenteDTO): string {
    return mov.asociadoNombre || '(sin asociado)';
  }

  getTipoMovimiento(mov: MovimientoRecenteDTO): string {
    const tipo = mov.tipo_movimiento || mov.tipo || mov.tipoTransaccion;
    return tipo === 'INGRESO' || tipo === 'COBRO' ? 'Cobro' : tipo === 'EGRESO' || tipo === 'PAGO' ? 'Pago' : 'Movimiento';
  }

  private cargar(): void {
    this.loading = true;
    this.subs.add(
      this.http.get<MovimientoRecenteDTO[]>(this.apiUrl).subscribe({
        next: (response) => {
          this.movimientos = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar movimientos del dashboard', err);
          this.loading = false;
        }
      })
    );
  }
}
