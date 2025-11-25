import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Cliente } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.clientes}`;
  private ivaUrl = `${environment.apiGateway}${environment.endpoints.condicion_iva}`;

  constructor(private http: HttpClient) {
  }

  // Obtener todos
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl).pipe(
      map(list => list.map(c => this.normalize(c)))
    );
  }

  // Obtener uno por ID
  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`).pipe(map(c => this.normalize(c)));
  }

  // Condiciones de IVA
  getCondicionesIva(): Observable<{ label: string; name: string }[]> {
    return this.http.get<any[]>(this.ivaUrl).pipe(
      map(items => items.map((i: any) => {
        const valor = (i?.name ?? i?.label ?? i) as string;
        return { label: valor, name: valor };
      }))
    );
  }

  // Crear
  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, this.serialize(cliente));
  }

  // Actualizar
  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, this.serialize(cliente));
  }

  // Eliminar
  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activar`, {});
  }

  desactivar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  private serialize(cliente: any) {
    const payload: any = { ...cliente };
    // Alinear con DTO backend
    if (payload?.condicion_iva || payload?.condicionIVA) {
      payload.condicionIVA = payload.condicion_iva ?? payload.condicionIVA;
      delete payload.condicion_iva;
    }
    return payload;
  }

  private normalize(cliente: any): Cliente {
    return {
      ...cliente,
      activo: cliente?.activo ?? true,
      condicion_iva: cliente?.condicionIVA ?? cliente?.condicion_iva ?? cliente?.condicion_iva,
    };
  }
}
