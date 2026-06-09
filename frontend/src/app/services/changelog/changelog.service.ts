import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChangelogService {
  private abrirSubject = new Subject<void>();
  abrir$ = this.abrirSubject.asObservable();

  abrir(): void {
    this.abrirSubject.next();
  }
}
