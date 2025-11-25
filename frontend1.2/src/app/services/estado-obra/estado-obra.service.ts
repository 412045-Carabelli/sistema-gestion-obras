import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstadoObraService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.estados_obras}`;

  constructor(private http: HttpClient) {
  }

  getEstados(): Observable<{ label: string; name: string}[]> {
    return this.http.get<{ label: string; name: string}[]>(this.apiUrl);
  }
}
