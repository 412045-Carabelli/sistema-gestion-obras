// src/app/services/clientes/cliente-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cliente } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class ClienteStateService {
  private clienteActualSubject = new BehaviorSubject<Cliente | null>(null);
  public clienteActual$: Observable<Cliente | null> = this.clienteActualSubject.asObservable();

  setCliente(cliente: Cliente | null) {
    this.clienteActualSubject.next(cliente);
  }

  getCliente(): Cliente | null {
    return this.clienteActualSubject.value;
  }

  clearCliente() {
    this.clienteActualSubject.next(null);
  }
}
