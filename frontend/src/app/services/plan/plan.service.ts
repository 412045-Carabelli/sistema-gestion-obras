import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PlanConfig,
  PlanCodigo,
  PlanFeature,
  PlanLimites,
  PlanFeatures
} from '../../core/models/models';

/**
 * PlanService — fuente de verdad del plan activo para el frontend.
 *
 * Estrategia:
 *  1. Al init (después del login), decodifica el JWT para obtener planCodigo/limites/features
 *     (fast path, sin HTTP call).
 *  2. Opcionalmente llama a GET /auth/mi-plan para refrescar (más preciso post-upgrade).
 *  3. Expone signals para que guards, directivas y componentes reaccionen reactivamente.
 *
 * Uso:
 *   planService.canAccess('facturas')      → boolean
 *   planService.isAtLimit('maxObrasActivas', 20) → boolean
 *   planService.planCodigo()               → 'BASICO'
 */
@Injectable({ providedIn: 'root' })
export class PlanService {

  private injector = inject(Injector);
  private apiUrl = `${environment.apiGateway}`;

  // --- State (signals) ---
  private _planConfig = signal<PlanConfig | null>(null);

  readonly planConfig = this._planConfig.asReadonly();

  readonly planCodigo = computed<PlanCodigo>(
    () => this._planConfig()?.planCodigo ?? 'FREE'
  );

  readonly esFree = computed(() => this.planCodigo() === 'FREE');
  readonly esEnterprise = computed(() => this.planCodigo() === 'ENTERPRISE');

  // --- Inicialización ---

  /**
   * Llamar inmediatamente después del login exitoso.
   * Decodifica el JWT para carga instantánea, luego refresca desde API.
   */
  initFromToken(accessToken: string): void {
    const fromJwt = this.decodeJwtClaims(accessToken);
    if (fromJwt) {
      this._planConfig.set(fromJwt);
    }
    // Refresca desde backend (más authoritative)
    this.fetchMiPlan();
  }

  /** Refresca el plan desde el backend (usar post-upgrade de plan) */
  fetchMiPlan(): void {
    const http = this.injector.get(HttpClient);
    http.get<any>(`${this.apiUrl}/auth/mi-plan`).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data) {
        this._planConfig.set(this.mapBackendResponse(data));
      }
    });
  }

  /** Limpia el plan al hacer logout */
  clear(): void {
    this._planConfig.set(null);
  }

  // --- Feature gating ---

  /** Retorna true si el plan activo tiene la feature habilitada */
  canAccess(feature: PlanFeature): boolean {
    const config = this._planConfig();
    if (!config) return false;
    return config.features[feature] === true;
  }

  /** Retorna true si el plan activo NO tiene la feature (para mostrar upgrade banner) */
  isLocked(feature: PlanFeature): boolean {
    return !this.canAccess(feature);
  }

  // --- Limit checking ---

  /**
   * Retorna true si el conteo actual alcanzó o superó el límite del plan.
   * @param limitKey  clave del límite en PlanLimites
   * @param current   cantidad actual de registros
   */
  isAtLimit(limitKey: keyof PlanLimites, current: number): boolean {
    const config = this._planConfig();
    if (!config) return false;
    const limite = config.limites[limitKey];
    if (limite === null) return false; // sin límite (Enterprise)
    return current >= limite;
  }

  /**
   * Retorna el límite numérico o null si es ilimitado.
   */
  getLimit(limitKey: keyof PlanLimites): number | null {
    return this._planConfig()?.limites[limitKey] ?? null;
  }

  // --- Helpers privados ---

  private decodeJwtClaims(token: string): PlanConfig | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.planCodigo) return null;

      return {
        planCodigo: payload.planCodigo,
        planNombre: payload.planCodigo,
        precioMensualUsd: 0,
        precioAnualUsd: 0,
        suscripcionEstado: 'ACTIVA',
        limites: payload.planLimites ?? this.limitesRestrictivos(),
        features: payload.planFeatures ?? this.featuresVacias(),
        featuresHabilitadas: this.buildFeaturesHabilitadas(payload.planFeatures ?? {})
      };
    } catch {
      return null;
    }
  }

  private mapBackendResponse(data: any): PlanConfig {
    return {
      planCodigo: data.planCodigo,
      planNombre: data.planNombre,
      precioMensualUsd: data.precioMensualUsd,
      precioAnualUsd: data.precioAnualUsd,
      suscripcionEstado: data.suscripcionEstado ?? 'FREE',
      ciclo: data.ciclo,
      fechaVencimiento: data.fechaVencimiento,
      precioFinalUsd: data.precioFinalUsd,
      limites: {
        maxUsuarios: data.maxUsuarios ?? null,
        maxObrasActivas: data.maxObrasActivas ?? null,
        maxClientes: data.maxClientes ?? null,
        maxProveedores: data.maxProveedores ?? null,
        maxTransaccionesMes: data.maxTransaccionesMes ?? null,
        maxStorageMb: data.maxStorageMb ?? null,
        diasHistorialReportes: data.diasHistorialReportes ?? 0,
      },
      features: {
        facturas: data.tieneFacturas ?? false,
        agenda: data.tieneAgenda ?? false,
        grupos_obras: data.tieneGruposObras ?? false,
        exportar: data.tieneExportar ?? false,
        push_notifications: data.tienePushNotifications ?? false,
        soporte_prioritario: data.tieneSoportePrioritario ?? false,
        api_access: data.tieneApiAccess ?? false,
        whatsapp_bot: data.tieneWhatsappBot ?? false,
        gantt: data.tieneGantt ?? false,
      },
      featuresHabilitadas: data.featuresHabilitadas ?? []
    };
  }

  private buildFeaturesHabilitadas(features: Record<string, boolean>): PlanFeature[] {
    return Object.entries(features)
      .filter(([, v]) => v === true)
      .map(([k]) => k as PlanFeature);
  }

  private limitesRestrictivos(): PlanLimites {
    return {
      maxUsuarios: 1, maxObrasActivas: 3, maxClientes: 10,
      maxProveedores: 10, maxTransaccionesMes: 10, maxStorageMb: 50,
      diasHistorialReportes: 0
    };
  }

  private featuresVacias(): PlanFeatures {
    return {
      facturas: false, agenda: false, grupos_obras: false,
      exportar: false, push_notifications: false,
      soporte_prioritario: false, api_access: false,
      whatsapp_bot: false, gantt: false
    };
  }
}
