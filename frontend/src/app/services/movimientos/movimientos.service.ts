import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movimiento } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private bffUrl = `${environment.apiGateway}/bff/transacciones`;

  constructor(private http: HttpClient) {}

  listarConAsociados(page: number = 0, size: number = 50): Observable<any> {
    return this.http.get<any>(`${this.bffUrl}/con-asociados?page=${page}&size=${size}`);
  }

  listar(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.bffUrl}`);
  }

  obtenerPorId(id: number): Observable<Movimiento> {
    return this.http.get<Movimiento>(`${this.bffUrl}/${id}`);
  }

  crear(payload: Partial<Movimiento>): Observable<Movimiento> {
    return this.http.post<Movimiento>(this.bffUrl, payload);
  }

  actualizar(id: number, payload: Partial<Movimiento>): Observable<Movimiento> {
    return this.http.put<Movimiento>(`${this.bffUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.bffUrl}/${id}`);
  }
}
