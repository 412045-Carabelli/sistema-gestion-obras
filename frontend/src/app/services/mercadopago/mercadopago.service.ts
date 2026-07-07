import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MpIniciarRequest {
  planId: number;
  ciclo: 'MENSUAL' | 'ANUAL';
  codigoDescuento?: string;
}

export interface MpIniciarResponse {
  initPoint: string;
  preapprovalId: string;
  externalReference: string;
  estado: string;
}

export interface MpEstadoResponse {
  preapprovalId: string;
  mpStatus: string;
  estadoLocal: string;
  planCodigo: string;
  ciclo: string;
  fechaVencimiento: string;
  sincronizado: boolean;
}

@Injectable({ providedIn: 'root' })
export class MercadoPagoService {

  private http = inject(HttpClient);
  private base = `${environment.apiGateway}/bff/mp`;

  iniciarSuscripcion(req: MpIniciarRequest): Observable<MpIniciarResponse> {
    return this.http.post<MpIniciarResponse>(`${this.base}/suscribir`, req);
  }

  consultarEstado(): Observable<MpEstadoResponse> {
    return this.http.get<MpEstadoResponse>(`${this.base}/suscripcion/estado`);
  }

  cancelarSuscripcion(): Observable<void> {
    return this.http.delete<void>(`${this.base}/suscripcion/cancelar`);
  }
}
