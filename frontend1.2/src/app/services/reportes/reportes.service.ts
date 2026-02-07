import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  AvanceTareasResponse,
  CostosPorCategoriaResponse,
  EstadoFinancieroObraResponse,
  EstadoObrasFilter,
  EstadoObrasResponse,
  CuentaCorrienteObraResponse,
  CuentaCorrienteProveedorResponse,
  CuentaCorrienteClienteResponse,
  ComisionesResponse,
  DashboardFinancieroResponse,
  FlujoCajaResponse,
  IngresosEgresosResponse,
  NotasObraResponse,
  PendientesResponse,
  RankingClientesResponse,
  RankingProveedoresResponse,
  ReportFilter,
  ResumenGeneralResponse
} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.reportes}`;

  constructor(private http: HttpClient) {
  }

  getResumenGeneral(): Observable<ResumenGeneralResponse> {
    return this.http.get<ResumenGeneralResponse>(`${this.apiUrl}/generales/resumen`);
  }

  getIngresosEgresos(filtro?: ReportFilter): Observable<IngresosEgresosResponse> {
    return this.http.post<IngresosEgresosResponse>(`${this.apiUrl}/financieros/ingresos-egresos`, filtro ?? {});
  }

  getEstadoFinanciero(obraId: number): Observable<EstadoFinancieroObraResponse> {
    return this.http.get<EstadoFinancieroObraResponse>(`${this.apiUrl}/financieros/estado-obra/${obraId}`);
  }

  getFlujoCaja(filtro?: ReportFilter): Observable<FlujoCajaResponse> {
    return this.http.post<FlujoCajaResponse>(`${this.apiUrl}/financieros/flujo-caja`, filtro ?? {});
  }

  getDashboardFinanciero(filtro?: ReportFilter): Observable<DashboardFinancieroResponse> {
    return this.http.post<DashboardFinancieroResponse>(`${this.apiUrl}/financieros/dashboard`, filtro ?? {});
  }

  getDeudasGlobales(filtro?: ReportFilter): Observable<{ deudaClientes: number; deudaProveedores: number }> {
    return this.http.post<{ deudaClientes: number; deudaProveedores: number }>(
      `${this.apiUrl}/financieros/deudas-globales`,
      filtro ?? {}
    );
  }

  getPendientes(filtro?: ReportFilter): Observable<PendientesResponse> {
    return this.http.post<PendientesResponse>(`${this.apiUrl}/financieros/pendientes`, filtro ?? {});
  }

  getEstadoObras(filtro?: EstadoObrasFilter): Observable<EstadoObrasResponse> {
    return this.http.post<EstadoObrasResponse>(`${this.apiUrl}/operativos/estado-obras`, filtro ?? {});
  }

  getAvanceTareas(filtro?: ReportFilter): Observable<AvanceTareasResponse> {
    return this.http.post<AvanceTareasResponse>(`${this.apiUrl}/operativos/avance-tareas`, filtro ?? {});
  }

  getCostosPorCategoria(filtro?: ReportFilter): Observable<CostosPorCategoriaResponse> {
    return this.http.post<CostosPorCategoriaResponse>(`${this.apiUrl}/operativos/costos-categoria`, filtro ?? {});
  }

  getRankingClientes(filtro?: ReportFilter): Observable<RankingClientesResponse> {
    return this.http.post<RankingClientesResponse>(`${this.apiUrl}/generales/ranking-clientes`, filtro ?? {});
  }

  getRankingProveedores(filtro?: ReportFilter): Observable<RankingProveedoresResponse> {
    return this.http.post<RankingProveedoresResponse>(`${this.apiUrl}/generales/ranking-proveedores`, filtro ?? {});
  }

  getNotasGenerales(): Observable<NotasObraResponse[]> {
    return this.http.get<NotasObraResponse[]>(`${this.apiUrl}/obras/notas`);
  }

  getNotasPorObra(obraId: number): Observable<NotasObraResponse> {
    return this.http.get<NotasObraResponse>(`${this.apiUrl}/obras/${obraId}/notas`);
  }

  getCuentaCorrienteObra(filtro?: ReportFilter): Observable<CuentaCorrienteObraResponse> {
    return this.http.post<CuentaCorrienteObraResponse>(`${this.apiUrl}/financieros/cuenta-corriente-obra`, filtro ?? {});
  }

  getCuentaCorrienteObraGlobal(filtro?: ReportFilter): Observable<CuentaCorrienteObraResponse> {
    return this.http.post<CuentaCorrienteObraResponse>(`${this.apiUrl}/financieros/cuenta-corriente-obra-global`, filtro ?? {});
  }

  getCuentaCorrienteProveedor(filtro?: ReportFilter): Observable<CuentaCorrienteProveedorResponse> {
    return this.http.post<CuentaCorrienteProveedorResponse>(`${this.apiUrl}/financieros/cuenta-corriente-proveedor`, filtro ?? {});
  }

  getCuentaCorrienteProveedorGlobal(filtro?: ReportFilter): Observable<CuentaCorrienteProveedorResponse> {
    return this.http.post<CuentaCorrienteProveedorResponse>(`${this.apiUrl}/financieros/cuenta-corriente-proveedor-global`, filtro ?? {});
  }

  getCuentaCorrienteProveedores(): Observable<CuentaCorrienteProveedorResponse[]> {
    return this.http.post<CuentaCorrienteProveedorResponse[]>(`${this.apiUrl}/financieros/cuenta-corriente-proveedores`, {});
  }

  getCuentaCorrienteCliente(filtro?: ReportFilter): Observable<CuentaCorrienteClienteResponse> {
    return this.http.post<CuentaCorrienteClienteResponse>(`${this.apiUrl}/financieros/cuenta-corriente-cliente`, filtro ?? {});
  }

  getComisiones(filtro?: ReportFilter): Observable<ComisionesResponse> {
    // BFF espera POST y redirige a /comisiones/general o /comisiones/obra/{id} segÃºn filtro
    return this.http.post<ComisionesResponse>(`${this.apiUrl}/financieros/comisiones`, filtro ?? {});
  }

}
