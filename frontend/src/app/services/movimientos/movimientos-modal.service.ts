import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovimientosModalService {
  private abrirModalSubject = new Subject<void>();
  public abrirModal$ = this.abrirModalSubject.asObservable();

  abrirModal(): void {
    this.abrirModalSubject.next();
  }
}
