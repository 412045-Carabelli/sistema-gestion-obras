import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GrupoObra } from '../../core/models/models';

@Injectable({ providedIn: 'root' })
export class GrupoObrasService {
  private apiUrl = `${environment.apiGateway}/bff/obras/grupos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<GrupoObra[]> {
    return this.http.get<GrupoObra[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<GrupoObra> {
    return this.http.get<GrupoObra>(`${this.apiUrl}/${id}`);
  }

  listarPorCliente(idCliente: number): Observable<GrupoObra[]> {
    return this.http.get<GrupoObra[]>(`${this.apiUrl}/cliente/${idCliente}`);
  }

  listarActivosPorCliente(idCliente: number): Observable<GrupoObra[]> {
    return this.http.get<GrupoObra[]>(`${this.apiUrl}/cliente/${idCliente}/activos`);
  }

  crear(payload: GrupoObra): Observable<GrupoObra> {
    return this.http.post<GrupoObra>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: Partial<GrupoObra>): Observable<GrupoObra> {
    return this.http.put<GrupoObra>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
