import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EstadoObraService {
  private apiUrl = 'http://localhost:8080/api/obras/estados';

  constructor(private http: HttpClient) {
  }

  getEstados() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
