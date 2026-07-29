import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PlanService } from '../../../services/plan/plan.service';
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
        <button class="btn-primary" (click)="irAlDashboard()">Ir al Dashboard</button>
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
    .resultado-wrapper { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .resultado-card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.1); padding:3rem 2.5rem; text-align:center; max-width:440px; width:100%; }
    .icono { font-size:4rem; margin-bottom:1rem; color:#22c55e; }
    h1 { font-family:'Poppins',sans-serif; font-size:1.5rem; font-weight:700; color:#1a1a2e; margin-bottom:0.75rem; }
    p { color:#64748b; margin-bottom:1rem; font-size:0.95rem; line-height:1.6; }
    .estado-badge { display:inline-block; background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.8rem; font-weight:600; }
    .estado-badge.pendiente { background:#fef9c3; color:#854d0e; }
    .btn-primary { display:block; margin-top:1.5rem; background:#2563eb; color:#fff; border:none; border-radius:8px; padding:0.75rem 2rem; font-size:1rem; font-weight:600; cursor:pointer; width:100%; }
    .btn-primary:hover { background:#1d4ed8; }
  `]
})
export class SuscripcionExitoComponent implements OnInit {
  private router = inject(Router);
  private planService = inject(PlanService);
  private http = inject(HttpClient);

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
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
