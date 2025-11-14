import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.proveedores}`;
  private tiposUrl = `${environment.apiGateway}${environment.endpoints.tipo_proveedores}`;

  constructor(private http: HttpClient) {}

  // 🔹 Obtener todos los proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  // 🔹 Obtener proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear proveedor (envía solo el string del enum)
  createProveedor(proveedor: any): Observable<Proveedor> {
    const body = this.serializeProveedor(proveedor);
    return this.http.post<Proveedor>(this.apiUrl, body);
  }

  // 🔹 Actualizar proveedor
  updateProveedor(id: number, proveedor: any): Observable<Proveedor> {
    const body = this.serializeProveedor(proveedor);
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, body);
  }

  // 🔹 Obtener tipos de proveedor (ENUM → { value, label })
  getTipos(): Observable<{ label: string; name: string }[]> {
    return this.http.get<{ label: string; name: string }[]>(this.tiposUrl);
  }

  // ----------------------------------------------------------
  // 🔧 SERIALIZACIÓN (para enviar enums como string)
  // ----------------------------------------------------------
  private serializeProveedor(proveedor: any) {
    const body = { ...proveedor };

    if (body?.tipo_proveedor?.value) {
      body.tipo_proveedor = body.tipo_proveedor.value;
    }

    return body;
  }
}
