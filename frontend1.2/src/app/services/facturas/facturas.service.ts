import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Factura} from '../../core/models/models';

export interface FacturaPayload {
  id_cliente: number;
  id_obra?: number | null;
  monto: number;
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
    formData.append('monto_restante', '0');
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
