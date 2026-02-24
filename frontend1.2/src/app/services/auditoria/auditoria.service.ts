import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface AuditLog {
  id?: number;
  modulo?: string;
  tipoRequest?: string;
  endpoint?: string;
  tablaModificada?: string;
  codigoRespuesta?: number;
  respuesta?: string;
  fechaHora?: string;
  usuario?: string;
  ip?: string;
}

export interface AuditFilter {
  modulo?: string;
  tipo?: string;
  creador?: string;
  endpoint?: string;
  tabla?: string;
  codigo?: number;
  desde?: string;
  hasta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.auditoria}`;

  constructor(private http: HttpClient) {}

  getAudits(filter?: AuditFilter): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return;
        }
        params = params.set(key, String(value));
      });
    }
    return this.http.get<AuditLog[]>(this.apiUrl, {params});
  }

  getAuditById(id: number, modulo?: string): Observable<AuditLog> {
    const params = modulo ? new HttpParams().set('modulo', modulo) : undefined;
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`, {params});
  }
}
