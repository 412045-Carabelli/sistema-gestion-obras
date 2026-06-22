import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {EstadoObra, Obra, Tarea} from '../../core/models/models';
import {environment} from '../../../environments/environment';

export interface ObrasConDetallesResponse {
  content: Obra[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  estados: { label: string; name: string }[];
}

export interface ObraPayload {
  id?: number;
  id_cliente: number;
  id_grupo?: number;
  obra_estado: EstadoObra;
  nombre?: string;
  direccion?: string;
  fecha_inicio?: string | null;
  fecha_presupuesto?: string | null;
  fecha_fin?: string | null;
  tiene_comision: boolean;
  fecha_adjudicada?: string | null;
  fecha_perdida?: string | null;
  presupuesto?: number;
  beneficio_global?: boolean;
  beneficio?: number;
  comision?: number;
  notas?: string;
  memoria_descriptiva?: string;
  condiciones_presupuesto?: string;
  observaciones_presupuesto?: string;
  requiere_factura?: boolean;
  tareas?: Tarea[];
  costos?: CostoPayload[];
}

export interface CostoPayload {
  id_proveedor: number;
  item_numero?: string;
  descripcion: string;
  unidad: string;
  id_estado_pago: number;
  cantidad: number;
  precio_unitario: number;
  beneficio: number;
  subtotal: number;
  tipo_costo?: 'ORIGINAL' | 'ADICIONAL' | 'AJUSTE' | 'DEMASIA';
}


@Injectable({
  providedIn: 'root'
})
export class ObrasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.obras}`;

  constructor(private http: HttpClient) {
  }

  getObras(): Observable<Obra[]> {
    return this.http.get<Obra[]>(this.apiUrl, {withCredentials: true});
  }

  getObrasAll(): Observable<Obra[]> {
    const params = new HttpParams().set('size', '1000');
    return this.http.get<Obra[]>(this.apiUrl, {withCredentials: true, params});
  }

  getObrasParaMovimientos(): Observable<Obra[]> {
    const params = new HttpParams()
      .set('size', '1000')
      .set('estados', 'ADJUDICADA,EN_PROGRESO,FINALIZADA');
    return this.http.get<Obra[]>(this.apiUrl, {withCredentials: true, params});
  }

  getObrasConDetalles(page = 0, size = 50, filtros: { estado?: string; activo?: boolean; q?: string } = {}): Observable<ObrasConDetallesResponse> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.activo !== undefined) params = params.set('activo', String(filtros.activo));
    if (filtros.q) params = params.set('q', filtros.q);
    return this.http.get<ObrasConDetallesResponse>(`${this.apiUrl}/con-detalles`, {params});
  }

  getObraById(id: number): Observable<Obra> {
    return this.http.get<Obra>(`${this.apiUrl}/${id}`);
  }

  getUltimasCondiciones(): Observable<Obra> {
    return this.http.get<Obra>(`${this.apiUrl}/condiciones/ultima`);
  }

  createObra(obra: ObraPayload): Observable<Obra> {
    return this.http.post<Obra>(this.apiUrl, obra);
  }

  updateObra(id: number, obra: ObraPayload): Observable<Obra> {
    return this.http.put<Obra>(`${this.apiUrl}/${id}`, obra);
  }

  updateEstadoObra(idObra: number, estado: string) {
    return this.http.patch<void>(`${this.apiUrl}/${idObra}/estado/${estado}`, null);
  }

  activarObra(id: number) {
    return this.http.patch(
      `${this.apiUrl}/${id}/activo`,
      null,
    );
  }


}
