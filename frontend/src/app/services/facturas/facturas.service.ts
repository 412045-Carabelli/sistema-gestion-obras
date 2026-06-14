import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Cliente, Factura, Obra} from '../../core/models/models';

export interface FacturasResumenResponse {
  facturas: (Factura & { nombre_cliente?: string; nombre_obra?: string })[];
  obrasFacturacion: Array<{
    id: number;
    nombre: string;
    clienteNombre: string;
    estado: string;
    presupuesto: number;
    facturado: number;
    porFacturar: number;
    facturas: Factura[];
  }>;
  kpis: {
    totalFacturado: number;
    totalCobrado: number;
    totalPorCobrar: number;
    totalPorFacturar: number;
  };
  clientes: Pick<Cliente, 'id' | 'nombre'>[];
  obras: Pick<Obra, 'id' | 'nombre' | 'id_cliente' | 'obra_estado' | 'requiere_factura' | 'activo' | 'presupuesto'>[];
}

export interface FacturaPayload {
  id_cliente: number;
  id_obra?: number | null;
  monto: number;
  monto_restante?: number;
  fecha: string;
  descripcion?: string;
  estado?: string;
  impacta_cta_cte?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.facturas}`;

  constructor(private http: HttpClient) {
  }

  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.apiUrl);
  }

  getResumen(): Observable<FacturasResumenResponse> {
    return this.http.get<FacturasResumenResponse>(`${this.apiUrl}/resumen`);
  }

  getFacturaById(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`);
  }

  getFacturasByCliente(idCliente: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/cliente/${idCliente}`);
  }

  getFacturasByObra(idObra: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/obra/${idObra}`);
  }

  createFactura(payload: FacturaPayload, file?: File | null): Observable<Factura> {
    const formData = this.buildFormData(payload, file ?? undefined);
    return this.http.post<Factura>(this.apiUrl, formData);
  }

  updateFactura(id: number, payload: FacturaPayload, file?: File | null): Observable<Factura> {
    const formData = this.buildFormData(payload, file ?? undefined);
    return this.http.put<Factura>(`${this.apiUrl}/${id}`, formData);
  }

  deleteFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadFactura(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {responseType: 'blob'});
  }

  downloadFacturaResponse(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  getFacturaUrl(id: number): string {
    return `${this.apiUrl}/${id}/download`;
  }

  private buildFormData(payload: FacturaPayload, file?: File): FormData {
    const formData = new FormData();
    formData.append('id_cliente', String(payload.id_cliente));
    if (payload.id_obra != null) {
      formData.append('id_obra', String(payload.id_obra));
    }
    formData.append('monto', String(payload.monto));
    if (payload.monto_restante != null) {
      formData.append('monto_restante', String(payload.monto_restante));
    }
    formData.append('fecha', payload.fecha);
    if (payload.descripcion != null) {
      formData.append('descripcion', payload.descripcion);
    }
    if (payload.estado != null) {
      formData.append('estado', payload.estado);
    }
    if (payload.impacta_cta_cte != null) {
      formData.append('impacta_cta_cte', String(payload.impacta_cta_cte));
    }
    if (file) {
      formData.append('file', file, file.name);
    }
    return formData;
  }
}
