import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlanService } from '../../../services/plan/plan.service';

@Component({
  selector: 'app-suscripcion-exito',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resultado-wrapper">
      <div class="resultado-card exito">
        <div class="icono"><i class="pi pi-check-circle"></i></div>
        <h1>¡Suscripción activada!</h1>
        <p>Tu pago fue procesado correctamente. Tu plan ya está activo.</p>
        <button class="btn-primary" (click)="irAlDashboard()">Ir al Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .resultado-wrapper { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .resultado-card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.1); padding:3rem 2.5rem; text-align:center; max-width:440px; width:100%; }
    .icono { font-size:4rem; margin-bottom:1rem; color:#22c55e; }
    h1 { font-family:'Poppins',sans-serif; font-size:1.5rem; font-weight:700; color:#1a1a2e; margin-bottom:0.75rem; }
    p { color:#64748b; margin-bottom:2rem; font-size:0.95rem; line-height:1.6; }
    .btn-primary { background:#2563eb; color:#fff; border:none; border-radius:8px; padding:0.75rem 2rem; font-size:1rem; font-weight:600; cursor:pointer; }
    .btn-primary:hover { background:#1d4ed8; }
  `]
})
export class SuscripcionExitoComponent implements OnInit {
  private router = inject(Router);
  private planService = inject(PlanService);

  ngOnInit(): void {
    // Refresca el plan para que el estado local refleje la nueva suscripción
    this.planService.fetchMiPlan();
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
