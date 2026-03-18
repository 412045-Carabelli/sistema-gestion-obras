import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

export interface GlobalLoadingState {
  active: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalLoadingService {
  private pendingRequests = 0;
  private readonly stateSubject = new BehaviorSubject<GlobalLoadingState>({
    active: false,
    message: 'Procesando solicitud...'
  });

  readonly state$ = this.stateSubject.asObservable();

  show(message = 'Procesando solicitud...'): void {
    this.pendingRequests++;
    this.stateSubject.next({
      active: true,
      message
    });
  }

  hide(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    if (this.pendingRequests === 0) {
      this.stateSubject.next({
        active: false,
        message: 'Procesando solicitud...'
      });
    }
  }
}
