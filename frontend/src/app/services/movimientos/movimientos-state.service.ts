import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Movimiento } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class MovimientosStateService {
  private movimientoActualSubject = new BehaviorSubject<Movimiento | null>(null);
  public movimientoActual$ = this.movimientoActualSubject.asObservable();

  /** Si ya terminó de cargar el listado — permite que el layout no muestre el membrete hasta entonces. */
  private datosCargadosSubject = new BehaviorSubject<boolean>(false);
  public datosCargados$ = this.datosCargadosSubject.asObservable();

  setMovimiento(movimiento: Movimiento): void {
    this.movimientoActualSubject.next(movimiento);
  }

  getMovimiento(): Movimiento | null {
    return this.movimientoActualSubject.value;
  }

  clearMovimiento(): void {
    this.movimientoActualSubject.next(null);
  }

  setDatosCargados(cargados: boolean): void {
    this.datosCargadosSubject.next(cargados);
  }
}
