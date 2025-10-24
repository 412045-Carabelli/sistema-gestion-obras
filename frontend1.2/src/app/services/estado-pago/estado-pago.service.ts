import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {EstadoPago} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class EstadoPagoService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.estado_pago}`;

  constructor(private http: HttpClient) {
  }

  getEstadosPago(): Observable<EstadoPago[]> {
    return this.http.get<EstadoPago[]>(this.apiUrl);
  }
}
