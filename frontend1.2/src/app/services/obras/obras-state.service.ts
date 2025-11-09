// src/app/services/obra-state/obra-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Obra } from '../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class ObrasStateService {
  private obraActualSubject = new BehaviorSubject<Obra | null>(null);
  public obraActual$: Observable<Obra | null> = this.obraActualSubject.asObservable();

  setObra(obra: Obra | null) {
    this.obraActualSubject.next(obra);
  }

  getObra(): Obra | null {
    return this.obraActualSubject.value;
  }

  clearObra() {
    this.obraActualSubject.next(null);
  }
}
