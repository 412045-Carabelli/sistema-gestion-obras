import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ObraCosto} from '../../core/models/models';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CostosService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.costos}`;

  constructor(private http: HttpClient) {
  }

  getCostosByObra(idObra: number): Observable<ObraCosto[]> {
    return this.http.get<ObraCosto[]>(`${this.apiUrl}/${idObra}`);
  }

  updateEstadoPago(idCosto: number, idEstado: number) {
    return this.http.put(`${this.apiUrl}/${idCosto}/estado/${idEstado}`, {});
  }

  deleteCosto(id: number): Observable<ObraCosto> {
    return this.http.delete<ObraCosto>(`${this.apiUrl}/${id}`);
  }
}
