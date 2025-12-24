import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Factura} from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class FacturasStateService {
  private facturaActualSubject = new BehaviorSubject<Factura | null>(null);
  public facturaActual$: Observable<Factura | null> = this.facturaActualSubject.asObservable();

  setFactura(factura: Factura | null) {
    this.facturaActualSubject.next(factura);
  }

  getFactura(): Factura | null {
    return this.facturaActualSubject.value;
  }

  clearFactura() {
    this.facturaActualSubject.next(null);
  }
}
