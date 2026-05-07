import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCuentaCorrienteResponse, ReportFilter } from '../../core/models/models';

/**
 * Servicio HTTP para los KPIs del dashboard.
 * Llama a transacciones-service via api-gateway BFF.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {

  private apiUrl = `${environment.apiGateway}/bff/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los KPIs de cuenta corriente del dashboard.
   * Soporta filtros opcionales por obra, cliente, proveedor y rango de fechas.
   *
   * @param filtro ReportFilter con parámetros opcionales
   * @returns Observable de DashboardCuentaCorrienteResponse con: cobrado, porCobrar, pagado, porPagar, resultado
   */
  getCuentaCorriente(filtro: ReportFilter): Observable<DashboardCuentaCorrienteResponse> {
    return this.http.post<DashboardCuentaCorrienteResponse>(
      `${this.apiUrl}/cuenta-corriente`,
      filtro
    );
  }
}
