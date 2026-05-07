import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SaldoGrupoCliente {
  id_grupo: number;
  nombre_grupo: string;
  id_cliente: number;
  nombre_cliente: string;
  total_presupuesto: number;
  total_cobros: number;
  saldo_pendiente: number;
}

export interface SaldoGrupoProveedor {
  id_grupo: number;
  nombre_grupo: string;
  id_proveedor: number;
  nombre_proveedor: string;
  total_costos: number;
  total_pagos: number;
  saldo_pendiente: number;
}

export interface ResumenObraCliente {
  id_cliente: number;
  nombre_cliente: string;
  id_obra: number;
  nombre_obra: string;
  presupuestado: number;
  cobros_realizados: number;
  saldo: number;
}

export interface ResumenObraProveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  id_obra: number;
  nombre_obra: string;
  costos: number;
  pagos_realizados: number;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class SaldosGruposService {
  private apiUrl = `${environment.apiGateway}/bff/obras/saldos-grupos`;

  constructor(private http: HttpClient) {}

  obtenerSaldosGruposClientes(): Observable<SaldoGrupoCliente[]> {
    return this.http.get<SaldoGrupoCliente[]>(`${this.apiUrl}/clientes`, { withCredentials: true });
  }

  obtenerSaldosGruposProveedores(): Observable<SaldoGrupoProveedor[]> {
    return this.http.get<SaldoGrupoProveedor[]>(`${this.apiUrl}/proveedores`, { withCredentials: true });
  }

  obtenerResumenObrasClientes(): Observable<ResumenObraCliente[]> {
    return this.http.get<ResumenObraCliente[]>(`${this.apiUrl}/resumen-obras/clientes`, { withCredentials: true });
  }

  obtenerResumenObrasProveedores(): Observable<ResumenObraProveedor[]> {
    return this.http.get<ResumenObraProveedor[]>(`${this.apiUrl}/resumen-obras/proveedores`, { withCredentials: true });
  }
}
