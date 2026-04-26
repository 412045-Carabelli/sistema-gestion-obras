// src/app/services/proveedores-state/proveedores-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Proveedor } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresStateService {
  private proveedorActualSubject = new BehaviorSubject<Proveedor | null>(null);
  public proveedorActual$: Observable<Proveedor | null> = this.proveedorActualSubject.asObservable();

  setProveedor(proveedor: Proveedor | null) {
    this.proveedorActualSubject.next(proveedor);
  }

  getProveedor(): Proveedor | null {
    return this.proveedorActualSubject.value;
  }

  clearProveedor() {
    this.proveedorActualSubject.next(null);
  }
}
