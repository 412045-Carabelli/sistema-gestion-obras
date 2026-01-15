import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Transaccion} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class TransaccionesService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.transacciones}`;
  private tiposUrl = `${environment.apiGateway}${environment.endpoints.tipo_transaccion}`;

  constructor(private http: HttpClient) {
  }

  getByObra(idObra: number): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.apiUrl}/obra/${idObra}`);
  }

  getTipos(): Observable<{ label: string; name: string }[]> {
    return this.http.get<{ label: string; name: string }[]>(this.tiposUrl);
  }

  // Transacciones por asociado (PROVEEDOR o CLIENTE)
  getByAsociado(tipo: 'PROVEEDOR' | 'CLIENTE', id: number): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.apiUrl}/asociado/${tipo}/${id}`);
  }

  create(transaccion: Transaccion): Observable<Transaccion> {
    return this.http.post<Transaccion>(this.apiUrl, transaccion);
  }

  update(id: number, transaccion: Transaccion): Observable<Transaccion> {
    return this.http.put<Transaccion>(`${this.apiUrl}/${id}`, transaccion);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
}

