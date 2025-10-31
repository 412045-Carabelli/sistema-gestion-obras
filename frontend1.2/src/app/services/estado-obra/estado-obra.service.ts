import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadoObraService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.estados_obras}`;

  constructor(private http: HttpClient) {
  }

  getEstados() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
