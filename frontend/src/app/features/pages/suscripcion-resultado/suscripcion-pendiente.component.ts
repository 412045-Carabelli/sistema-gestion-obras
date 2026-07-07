import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suscripcion-pendiente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resultado-wrapper">
      <div class="resultado-card pendiente">
        <div class="icono"><i class="pi pi-clock"></i></div>
        <h1>Pago en proceso</h1>
        <p>Tu pago está siendo verificado. Una vez confirmado, tu plan se activará automáticamente. Podés cerrar esta ventana.</p>
        <button class="btn-secondary" (click)="irAMiPlan()">Ver Mi Plan</button>
      </div>
    </div>
  `,
  styles: [`
    .resultado-wrapper { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .resultado-card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.1); padding:3rem 2.5rem; text-align:center; max-width:440px; width:100%; }
    .icono { font-size:4rem; margin-bottom:1rem; color:#f59e0b; }
    h1 { font-family:'Poppins',sans-serif; font-size:1.5rem; font-weight:700; color:#1a1a2e; margin-bottom:0.75rem; }
    p { color:#64748b; margin-bottom:2rem; font-size:0.95rem; line-height:1.6; }
    .btn-secondary { background:#f8fafc; color:#2563eb; border:1px solid #2563eb; border-radius:8px; padding:0.75rem 2rem; font-size:1rem; font-weight:600; cursor:pointer; }
    .btn-secondary:hover { background:#e8f4fd; }
  `]
})
export class SuscripcionPendienteComponent {
  private router = inject(Router);

  irAMiPlan(): void {
    this.router.navigate(['/mi-plan']);
  }
}
