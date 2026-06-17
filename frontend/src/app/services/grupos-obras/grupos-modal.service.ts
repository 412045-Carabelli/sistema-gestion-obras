import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GruposModalService {
  private openModalSubject = new Subject<void>();
  public openModal$ = this.openModalSubject.asObservable();

  abrirModal(): void {
    this.openModalSubject.next();
  }
}
