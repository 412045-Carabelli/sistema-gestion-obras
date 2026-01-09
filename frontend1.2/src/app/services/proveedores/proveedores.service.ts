import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Proveedor } from '../../core/models/models';
import { environment } from '../../../environments/environment';

export interface CatalogoOption {
  id?: number;
  nombre: string;
  label: string;
  name: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private apiUrl = `${environment.apiGateway}${environment.endpoints.proveedores}`;
  private tiposUrl = `${environment.apiGateway}${environment.endpoints.tipo_proveedores}`;
  private gremiosUrl = `${environment.apiGateway}${environment.endpoints.gremios}`;

  constructor(private http: HttpClient) {}

  // Obtener todos los proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(map(items => items.map(i => this.toFrontProveedor(i))));
  }

  // Obtener proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(p => this.toFrontProveedor(p)));
  }

  // Crear proveedor
  createProveedor(proveedor: any): Observable<Proveedor> {
    const body = this.serializeProveedor(proveedor);
    return this.http.post<Proveedor>(this.apiUrl, body);
  }

  // Actualizar proveedor
  updateProveedor(id: number, proveedor: any): Observable<Proveedor> {
    const body = this.serializeProveedor(proveedor);
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, body);
  }

  // Tipos de proveedor
  getTipos(): Observable<CatalogoOption[]> {
    return this.http.get<any[]>(this.tiposUrl).pipe(map(items => items.map(i => this.toOption(i))));
  }

  crearTipo(nombre: string): Observable<CatalogoOption> {
    return this.http.post<any>(this.tiposUrl, { nombre }).pipe(map(data => this.toOption(data)));
  }

  actualizarTipo(id: number, nombre: string): Observable<CatalogoOption> {
    return this.http.put<any>(`${this.tiposUrl}/${id}`, { nombre }).pipe(map(data => this.toOption(data)));
  }

  eliminarTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tiposUrl}/${id}`);
  }

  // Gremios
  getGremios(): Observable<CatalogoOption[]> {
    return this.http.get<any[]>(this.gremiosUrl).pipe(map(items => items.map(i => this.toOption(i))));
  }

  crearGremio(nombre: string): Observable<CatalogoOption> {
    return this.http.post<any>(this.gremiosUrl, { nombre }).pipe(map(data => this.toOption(data)));
  }

  actualizarGremio(id: number, nombre: string): Observable<CatalogoOption> {
    return this.http.put<any>(`${this.gremiosUrl}/${id}`, { nombre }).pipe(map(data => this.toOption(data)));
  }

  eliminarGremio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gremiosUrl}/${id}`);
  }

  // Normaliza payload del proveedor
  private serializeProveedor(proveedor: any) {
    const body = { ...proveedor };

    const tipo =
      body?.tipo_proveedor?.value ??
      body?.tipo_proveedor?.name ??
      body?.tipo_proveedor ??
      body?.tipo;

    const gremio =
      body?.gremio?.value ??
      body?.gremio?.name ??
      body?.gremio;

    if (tipo) {
      body.tipo = tipo;
      body.tipo_proveedor = tipo;
    }

    if (gremio) {
      body.gremio = gremio;
      body.gremio_nombre = gremio;
    }

    if (body?.dniCuit && !body?.cuit) {
      body.cuit = body.dniCuit;
    }
    if (body?.dni_cuit && !body?.cuit) {
      body.cuit = body.dni_cuit;
    }
    if (body?.cuit && !body?.dniCuit) {
      body.dniCuit = body.cuit;
    }

    return body;
  }

  private toOption(item: any): CatalogoOption {
    const nombre = item?.nombre || item?.name || item?.label || '';
    return {
      id: item?.id,
      nombre,
      label: item?.label || nombre,
      name: item?.name || nombre,
      activo: item?.activo ?? true
    };
  }

  private toFrontProveedor(raw: any): Proveedor {
    // Normaliza campos que vienen del backend a la forma usada en el front
    const cuit = raw?.dniCuit ?? raw?.dni_cuit ?? raw?.cuit;
    const direccion = raw?.direccion ?? raw?.domicilio ?? raw?.direccion_proveedor;
    return {
      id: raw?.id,
      nombre: raw?.nombre,
      tipo_proveedor: raw?.tipo ?? raw?.tipo_proveedor,
      gremio: raw?.gremio ?? raw?.gremio_nombre,
      direccion,
      cuit,
      contacto: raw?.contacto,
      telefono: raw?.telefono,
      email: raw?.email,
      activo: raw?.activo ?? true,
      creado_en: raw?.creado_en ?? raw?.creadoEn,
      ultima_actualizacion: raw?.ultima_actualizacion ?? raw?.ultimaActualizacion,
      tipo_actualizacion: raw?.tipo_actualizacion ?? raw?.tipoActualizacion
    } as Proveedor;
  }
}
