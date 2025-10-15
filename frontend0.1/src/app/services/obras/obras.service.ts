import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {EstadoObra, Obra, Tarea} from '../../core/models/models';
import {environment} from '../../../enviroments/enviroment';

export interface ObraPayload {
  id?: number;
  id_cliente: number;
  obra_estado: EstadoObra;
  nombre?: string;
  direccion?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_adjudicada?: string | null;
  fecha_perdida?: string | null;
  presupuesto?: number;
  beneficio_global?: boolean;
  beneficio?: number;
  comision?: number;
  tareas?: Tarea[];
  costos?: CostoPayload[];
}

export interface CostoPayload {
  id_proveedor: number;
  descripcion: string;
  unidad: string;
  id_estado_pago: number;
  cantidad: number;
  precio_unitario: number;
  beneficio: number;
  subtotal: number;
}


@Injectable({
  providedIn: 'root'
})
export class ObrasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.obras}`;

  constructor(private http: HttpClient) {}

  getObras(): Observable<Obra[]> {
    return this.http.get<Obra[]>(this.apiUrl, { withCredentials: true });
  }

  getObraById(id: number): Observable<Obra> {
    return this.http.get<Obra>(`${this.apiUrl}/${id}`);
  }

  createObra(obra: ObraPayload): Observable<Obra> {
    return this.http.post<Obra>(this.apiUrl, obra);
  }

  updateObra(id: number, obra: ObraPayload): Observable<Obra> {
    return this.http.put<Obra>(`${this.apiUrl}/${id}`, obra);
  }

  updateEstadoObra(idObra: number, idEstado: number) {
    return this.http.patch<void>(`${this.apiUrl}/${idObra}/estado/${idEstado}`, null);
  }

  deleteObra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
