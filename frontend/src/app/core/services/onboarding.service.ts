import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'sgo_onboarding';

/**
 * Trackea si el usuario está en el flujo de alta guiado:
 * 1) crear cuenta → 2) elegir plan → 3) configurar empresa.
 * Mientras está activo, el shell principal oculta navbar/sidebar y
 * muestra el stepper en su lugar (ver AppComponent).
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private _activo = signal<boolean>(sessionStorage.getItem(STORAGE_KEY) === '1');
  readonly activo = this._activo.asReadonly();

  iniciar(): void {
    sessionStorage.setItem(STORAGE_KEY, '1');
    this._activo.set(true);
  }

  finalizar(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this._activo.set(false);
  }
}
