import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ReportFilter, DeudasGlobalesResponse } from '../../../../core/models/models';
import { Subscription } from 'rxjs';

/**
 * Componente independiente para la tabla de deudas del dashboard.
 * Muestra deudas de clientes y proveedores por obra.
 * Se recarga automáticamente cuando cambian los filtros via ngOnChanges.
 */
@Component({
  selector: 'app-dashboard-deudas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-deudas.component.html',
  styleUrls: ['./dashboard-deudas.component.css']
})
export class DashboardDeudasComponent implements OnInit, OnChanges, OnDestroy {

  @Input() filtros: ReportFilter = {};

  loading = false;
  datos: DeudasGlobalesResponse | null = null;
  private subs = new Subscription();
  private apiUrl = `${environment.apiGateway}/bff/reportes/financieros/deudas-globales`;

  constructor(private http: HttpClient) {}

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

  getRangeArray(): number[] {
    if (!this.datos) return [];
    const max = Math.max(
      this.datos.detalleDeudaClientes?.length || 0,
      this.datos.detalleDeudaProveedores?.length || 0
    );
    return Array.from({ length: max }, (_, i) => i);
  }

  private cargar(): void {
    this.loading = true;
    this.subs.add(
      this.http.post<DeudasGlobalesResponse>(this.apiUrl, this.filtros).subscribe({
        next: (response) => {
          this.datos = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar deudas del dashboard', err);
          this.loading = false;
        }
      })
    );
  }
}
