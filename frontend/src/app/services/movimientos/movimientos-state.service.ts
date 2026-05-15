import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Movimiento } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class MovimientosStateService {
  private movimientoActualSubject = new BehaviorSubject<Movimiento | null>(null);
  public movimientoActual$ = this.movimientoActualSubject.asObservable();

  setMovimiento(movimiento: Movimiento): void {
    this.movimientoActualSubject.next(movimiento);
  }

  getMovimiento(): Movimiento | null {
    return this.movimientoActualSubject.value;
  }

  clearMovimiento(): void {
    this.movimientoActualSubject.next(null);
  }
}
