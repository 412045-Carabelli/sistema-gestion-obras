import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlanFeature } from '../../core/models/models';

/**
 * Banner inline para mostrar cuando un recurso o acción está bloqueado por plan.
 *
 * Uso 1 — límite de registros alcanzado (HTTP 402 PLAN_LIMIT_EXCEEDED):
 *   <app-upgrade-banner
 *     tipo="limite"
 *     recurso="obras"
 *     [limiteActual]="20"
 *     [cantidadActual]="20">
 *   </app-upgrade-banner>
 *
 * Uso 2 — feature no disponible (HTTP 402 FEATURE_NOT_AVAILABLE):
 *   <app-upgrade-banner
 *     tipo="feature"
 *     feature="exportar">
 *   </app-upgrade-banner>
 *
 * Uso 3 — bloque total de sección (sin datos del error):
 *   <app-upgrade-banner tipo="seccion" mensaje="Esta sección requiere plan Profesional">
 *   </app-upgrade-banner>
 */
@Component({
  selector: 'app-upgrade-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upgrade-banner-inline" [class]="'upgrade-banner-' + tipo">
      <div class="upgrade-icon">
        <i [class]="iconClass"></i>
      </div>
      <div class="upgrade-content">
        <span class="upgrade-title">{{ titulo }}</span>
        <p class="upgrade-msg">{{ mensaje }}</p>
      </div>
      <button class="upgrade-btn" (click)="irAPlanes()">
        <i class="pi pi-arrow-up-right"></i>
        Ver planes
      </button>
    </div>
  `,
  styles: [`
    .upgrade-banner-inline {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      border-radius: 12px;
      border: 1px solid;
      margin: 8px 0;
      font-family: "Poppins", sans-serif;
    }

    /* Tipo: límite */
    .upgrade-banner-limite {
      background: rgba(245, 158, 11, 0.06);
      border-color: rgba(245, 158, 11, 0.25);
    }
    .upgrade-banner-limite .upgrade-icon i { color: #f59e0b; }

    /* Tipo: feature */
    .upgrade-banner-feature {
      background: rgba(99, 102, 241, 0.06);
      border-color: rgba(99, 102, 241, 0.25);
    }
    .upgrade-banner-feature .upgrade-icon i { color: #818cf8; }

    /* Tipo: sección bloqueada */
    .upgrade-banner-seccion {
      background: rgba(16, 10, 10, 0.04);
      border-color: rgba(0,0,0,0.1);
    }
    .upgrade-banner-seccion .upgrade-icon i { color: #9ca3af; }

    .upgrade-icon { flex-shrink: 0; }
    .upgrade-icon i { font-size: 1.4rem; }

    .upgrade-content { flex: 1; }
    .upgrade-title {
      display: block;
      font-size: 0.88rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 2px;
    }
    .upgrade-msg {
      font-size: 0.8rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }

    .upgrade-btn {
      flex-shrink: 0;
      background: #111827;
      color: #E8FF47;
      border: 1px solid rgba(232,255,71,0.3);
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: background 0.2s, border-color 0.2s;
    }
    .upgrade-btn:hover {
      background: #1f2937;
      border-color: #E8FF47;
    }
  `]
})
export class UpgradeBannerComponent {
  @Input() tipo: 'limite' | 'feature' | 'seccion' = 'limite';
  @Input() recurso?: string;
  @Input() feature?: PlanFeature | string;
  @Input() limiteActual?: number;
  @Input() cantidadActual?: number;
  @Input() mensaje?: string;

  private router = inject(Router);

  get iconClass(): string {
    switch (this.tipo) {
      case 'limite':  return 'pi pi-exclamation-triangle';
      case 'feature': return 'pi pi-lock';
      case 'seccion': return 'pi pi-lock';
    }
  }

  get titulo(): string {
    switch (this.tipo) {
      case 'limite':
        return `Límite de ${this.recurso ?? 'registros'} alcanzado`;
      case 'feature':
        return `Funcionalidad no disponible en tu plan`;
      case 'seccion':
        return 'Sección bloqueada';
    }
  }

  get mensaje(): string {
    if (this._mensaje) return this._mensaje;
    switch (this.tipo) {
      case 'limite':
        return `Llegaste al límite de ${this.cantidadActual}/${this.limiteActual} ${this.recurso ?? 'registros'} de tu plan actual. Actualizá para crear más.`;
      case 'feature':
        return `"${this.feature}" no está incluido en tu plan actual. Actualizá para acceder a esta funcionalidad.`;
      case 'seccion':
        return 'Esta sección requiere un plan superior.';
    }
  }

  private _mensaje?: string;
  ngOnChanges(): void {
    this._mensaje = (this as any)['mensaje'];
  }

  irAPlanes(): void {
    const queryParams: Record<string, string> = {};
    if (this.feature) queryParams['feature'] = String(this.feature);
    this.router.navigate(['/planes'], { queryParams });
  }
}
