import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PlanService } from '../../../services/plan/plan.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { ConfiguracionService } from '../../../services/configuracion/configuracion.service';
import { environment } from '../../../../environments/environment';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-suscripcion-exito',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resultado-wrapper">
      <div class="resultado-card exito" *ngIf="!cargando(); else loader">
        <div class="icono"><i class="pi pi-check-circle"></i></div>
        <h1>¡Suscripción activada!</h1>
        <p *ngIf="planNombre()">Plan <strong>{{ planNombre() }}</strong> activo correctamente.</p>
        <p *ngIf="!planNombre()">Tu pago fue procesado. El plan se activará en breve.</p>
        <p class="estado-badge" [class.pendiente]="estadoLocal() === 'PENDIENTE_PAGO'">
          Estado: {{ estadoLocal() || 'verificando...' }}
        </p>
        <button class="btn-primary" (click)="continuar()">{{ enOnboarding ? 'Configurar mi empresa' : 'Ir al Dashboard' }}</button>
      </div>
      <ng-template #loader>
        <div class="resultado-card exito">
          <div class="icono"><i class="pi pi-spin pi-spinner"></i></div>
          <h1>Verificando pago...</h1>
          <p>Consultando estado con Mercado Pago</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap");

    :host { display:block; height:100%; }
    .resultado-wrapper {
      display:flex; justify-content:center; align-items:center; height:100%; padding:2rem;
      background:#0a0a0a;
      background-image:
        radial-gradient(circle at 15% 0%, rgba(232,255,71,0.06), transparent 45%),
        radial-gradient(circle at 85% 20%, rgba(59,130,246,0.08), transparent 40%);
      font-family:'Space Grotesk', sans-serif; box-sizing:border-box;
    }
    .resultado-card { background:#161616; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:3rem 2.5rem; text-align:center; max-width:440px; width:100%; }
    .icono { font-size:4rem; margin-bottom:1rem; color:#E8FF47; }
    h1 { font-size:1.5rem; font-weight:700; color:#F0F0F0; margin-bottom:0.75rem; }
    p { color:#888; margin-bottom:1rem; font-size:0.95rem; line-height:1.6; }
    .estado-badge { display:inline-block; background:rgba(232,255,71,0.15); border:1px solid #E8FF47; color:#E8FF47; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.8rem; font-weight:600; }
    .estado-badge.pendiente { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.15); color:#888; }
    .btn-primary { display:block; margin-top:1.5rem; background:#E8FF47; color:#0e0e0e; border:none; border-radius:8px; padding:0.75rem 2rem; font-size:1rem; font-weight:700; cursor:pointer; width:100%; transition:background 0.2s; }
    .btn-primary:hover { background:#d4eb2e; }
  `]
})
export class SuscripcionExitoComponent implements OnInit {
  private router = inject(Router);
  private planService = inject(PlanService);
  private onboardingService = inject(OnboardingService);
  private http = inject(HttpClient);
  // Se inyecta para forzar la carga de /bff/configuracion apenas se entra acá: si el flag
  // manual de onboarding se perdió (ej: MP abrió el checkout en pestaña nueva), esto es lo
  // que le informa a OnboardingService que la empresa todavía no está configurada.
  private configuracionService = inject(ConfiguracionService);

  get enOnboarding(): boolean {
    return this.onboardingService.faltaConfigurarEmpresa();
  }

  cargando = signal(true);
  estadoLocal = signal<string>('');
  planNombre = signal<string>('');

  ngOnInit(): void {
    // Consulta el estado real desde MP (sincroniza la DB si difiere)
    this.http.get<any>(`${environment.apiGateway}/bff/mp/suscripcion/estado`).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data) {
        this.estadoLocal.set(data.estadoLocal ?? data.mpStatus ?? '');
        this.planNombre.set(data.planCodigo ?? '');
      }
      this.cargando.set(false);
      // Refresca el plan en el servicio para que guards y sidebar actualicen
      this.planService.fetchMiPlan();

      // En onboarding no tiene sentido mostrar una tarjeta de éxito con un botón
      // "Configurar mi empresa" — el paso 3 ES el formulario, así que se entra directo.
      if (this.enOnboarding) {
        this.router.navigate(['/configuracion']);
      }
    });
  }

  continuar(): void {
    this.router.navigate([this.enOnboarding ? '/configuracion' : '/dashboard']);
  }
}
