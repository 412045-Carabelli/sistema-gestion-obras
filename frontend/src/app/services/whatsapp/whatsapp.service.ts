import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnviarPresupuestoRequest {
  telefono: string;
  clienteNombre: string;
  obraNombre: string;
  presupuestoTotal: string;
  fechaPresupuesto: string;
}

export interface WhatsAppResponse {
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private apiUrl = `${environment.apiGateway}/bff/whatsapp`;

  constructor(private http: HttpClient) {}

  enviarPresupuesto(data: EnviarPresupuestoRequest): Observable<WhatsAppResponse> {
    return this.http.post<WhatsAppResponse>(`${this.apiUrl}/presupuesto`, data);
  }

  triggerAgendaNotificaciones(): Observable<{ ok: boolean; enviados?: number; mensaje?: string; error?: string }> {
    return this.http.post<{ ok: boolean; enviados?: number; mensaje?: string; error?: string }>(`${this.apiUrl}/agenda/trigger`, {});
  }

  triggerResumenSemanal(): Observable<{ ok: boolean; enviados?: number; mensaje?: string; error?: string }> {
    return this.http.post<{ ok: boolean; enviados?: number; mensaje?: string; error?: string }>(`${this.apiUrl}/agenda/resumen-semanal`, {});
  }
}
