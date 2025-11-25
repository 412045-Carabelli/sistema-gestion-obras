import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Cliente} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.clientes}`;
  private ivaUrl = `${environment.apiGateway}${environment.endpoints.condicion_iva}`;

  constructor(private http: HttpClient) {
  }

  // 🧾 Obtener todos
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // 🧍 Obtener uno por ID
  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  // 📑 Condiciones de IVA
  getCondicionesIva(): Observable<{ label: string; name: string }[]> {
    return this.http.get<{ label: string; name: string }[]>(this.ivaUrl);
  }

  // ➕ Crear
  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // ✏️ Actualizar
  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  // ❌ Eliminar
  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
