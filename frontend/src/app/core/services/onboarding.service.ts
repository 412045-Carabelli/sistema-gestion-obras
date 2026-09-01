import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'sgo_onboarding';

/**
 * Trackea si el usuario está en el flujo de alta guiado:
 * 1) crear cuenta → 2) elegir plan → 3) configurar empresa.
 * Mientras está activo, el shell principal oculta navbar/sidebar y
 * muestra el stepper en su lugar (ver AppComponent).
 *
 * `activo` (usado por /configuracion y el shell para decidir si se ve el
 * stepper oscuro) depende SOLO del flag manual de sessionStorage — nunca del
 * estado real de la empresa. Así, una vez que el usuario ya está navegando
 * el sistema normal (dashboard, obras, etc.) esa pantalla no vuelve a
 * aparecer, haya terminado de guardar los datos de la empresa o no. Ese flag
 * se limpia automáticamente al navegar a cualquier ruta fuera del circuito
 * de alta (ver AppComponent), así nunca queda pegado en una pestaña donde el
 * usuario abandonó el alta a mitad de camino.
 *
 * `faltaConfigurarEmpresa` es para el único lugar donde el flag manual no
 * alcanza: /suscripcion/exito, justo al volver del pago. Si Mercado Pago
 * abrió el checkout en una pestaña nueva, el sessionStorage de esa pestaña
 * nace vacío y el flag se pierde — ahí hace falta el respaldo del backend
 * (ConfiguracionService avisa acá si a la empresa le falta el nombre) para
 * no mandar a un usuario recién pagado directo al dashboard sin haber
 * configurado nada.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private _activoManual = signal<boolean>(sessionStorage.getItem(STORAGE_KEY) === '1');
  private _empresaConfigurada = signal<boolean | null>(null);

  readonly activo = this._activoManual.asReadonly();

  readonly faltaConfigurarEmpresa = computed(() => {
    const configurada = this._empresaConfigurada();
    if (configurada === null) return this._activoManual();
    return this._activoManual() || !configurada;
  });

  iniciar(): void {
    sessionStorage.setItem(STORAGE_KEY, '1');
    this._activoManual.set(true);
  }

  finalizar(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this._activoManual.set(false);
  }

  /** Llamado por ConfiguracionService cuando resuelve el estado real de la empresa. */
  actualizarEstadoEmpresa(configurada: boolean): void {
    this._empresaConfigurada.set(configurada);
  }
}
