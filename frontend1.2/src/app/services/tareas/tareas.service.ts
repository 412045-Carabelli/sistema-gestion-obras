import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {EstadoTarea, Proveedor, Tarea} from '../../core/models/models';
import {environment} from '../../../environments/environment';

export interface TareaPayload {
  id?: number;
  id_obra: number;
  id_proveedor: number;
  proveedor?: Proveedor;
  numero_orden?: number;
  estado_tarea: string;
  nombre: string;
  descripcion?: string;
   porcentaje?: number;
  fecha_inicio?: string;
}

@Injectable({providedIn: 'root'})
export class TareasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.tareas}`;

  private tareasSubject = new BehaviorSubject<Tarea[]>([]);
  tareas$ = this.tareasSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  // ✅ Obtener tareas de una obra
  getTareasByObra(idObra: number, soloActivas = false, ordenAntiguas = false): Observable<Tarea[]> {
    const params: string[] = [];
    if (soloActivas) params.push('soloActivas=true');
    if (ordenAntiguas) params.push('ordenAntiguas=true');
    const url = params.length
      ? `${this.apiUrl}/${idObra}?${params.join('&')}`
      : `${this.apiUrl}/${idObra}`;
    return this.http.get<Tarea[]>(url).pipe(
      tap(tareas => this.emitirActualizacion(tareas))
    );
  }

  // ✅ Obtener tareas por proveedor
  getTareasByProveedor(idProveedor: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/proveedor/${idProveedor}`);
  }

  // ✅ Crear tarea (usa la URL con idObra en el path)
  createTarea(tarea: TareaPayload): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.apiUrl}/${tarea.id_obra}`, tarea).pipe(
      tap(() => this.refrescarTareas(tarea.id_obra))
    );
  }

  // ✅ Completar tarea (PUT sin payload, solo id en la URL)
  completarTarea(id: number, idObra: number): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/${id}/completar`, null).pipe(
      tap(() => this.refrescarTareas(idObra))
    );
  }

  // ✅ Editar tarea
  updateTarea(id: number, payload: TareaPayload): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => this.refrescarTareas(payload.id_obra))
    );
  }

  // ✅ Eliminar tarea
  deleteTarea(id: number, idObra: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refrescarTareas(idObra))
    );
  }

  private emitirActualizacion(tareas: Tarea[]) {
    this.tareasSubject.next(tareas);
  }

  private refrescarTareas(idObra: number) {
    this.getTareasByObra(idObra).subscribe();
  }
}
