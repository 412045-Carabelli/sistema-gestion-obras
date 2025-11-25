import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ObraCosto} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class CostosService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.costos}`;

  constructor(private http: HttpClient) {}

  // Obtener costos por obra desde el BFF
  getByObra(idObra: number): Observable<ObraCosto[]> {
    return this.http.get<ObraCosto[]>(`${this.apiUrl}/${idObra}`);
  }

  createCosto(payload: Partial<ObraCosto>): Observable<ObraCosto> {
    return this.http.post<ObraCosto>(`${this.apiUrl}`, payload);
  }

  updateCosto(idCosto: number, payload: Partial<ObraCosto>): Observable<ObraCosto> {
    return this.http.put<ObraCosto>(`${this.apiUrl}/${idCosto}`, payload);
  }

  deleteCosto(idCosto: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCosto}`);
  }

  // Actualizar estado de pago de un costo
  updateEstadoPago(idCosto: number, estadoValue: string): Observable<ObraCosto> {
    return this.http.put<ObraCosto>(`${this.apiUrl}/${idCosto}/estado/${estadoValue}`, {});
  }
}
