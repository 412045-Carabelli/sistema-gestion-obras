import {Injectable} from '@angular/core';
import {ObraProveedor} from '../../core/models/models';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ObrasProveedoresService {

  private apiUrl = 'http://localhost:8080/bff/obras/costos';

  constructor(private http: HttpClient) {
  }

  getObrasProveedoresByObra(idObra: number) {
    return this.http.get<ObraProveedor[]>(`${this.apiUrl}/${idObra}`);
  }
}
