import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {Agenda} from '../../core/models/models';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgendasService {
  private apiUrl = `${environment.apiGateway}/bff/agendas`;
  private crearNuevaAgendaSubject = new Subject<void>();

  crearNuevaAgenda$ = this.crearNuevaAgendaSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAgendas(): Observable<Agenda[]> {
    return this.http.get<Agenda[]>(this.apiUrl);
  }

  getAgenda(id: number): Observable<Agenda> {
    return this.http.get<Agenda>(`${this.apiUrl}/${id}`);
  }

  crear(agenda: Agenda): Observable<Agenda> {
    return this.http.post<Agenda>(this.apiUrl, this.mapToRequest(agenda));
  }

  actualizar(id: number, agenda: Agenda): Observable<Agenda> {
    return this.http.put<Agenda>(`${this.apiUrl}/${id}`, this.mapToRequest(agenda));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, estado: string): Observable<Agenda> {
    return this.http.patch<Agenda>(`${this.apiUrl}/${id}/estado`, {estado});
  }

  emitirCrearNuevaAgenda() {
    this.crearNuevaAgendaSubject.next();
  }

  private mapToRequest(agenda: Agenda) {
    return {
      titulo: agenda.titulo,
      obraId: agenda.obraId || null,
      clienteId: agenda.clienteId || null,
      proveedorId: agenda.proveedorId || null,
      estado: agenda.estado,
      descripcion: agenda.descripcion || '',
      fechaInicio: agenda.fechaInicio || null,
      fechaVencimiento: agenda.fechaVencimiento || null
    };
  }
}
