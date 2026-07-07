import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suscripcion-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resultado-wrapper">
      <div class="resultado-card error">
        <div class="icono"><i class="pi pi-times-circle"></i></div>
        <h1>Pago no completado</h1>
        <p>No pudimos procesar tu pago. Podés intentarlo nuevamente o elegir otro método de pago.</p>
        <div class="acciones">
          <button class="btn-primary" (click)="irAPlanes()">Intentar nuevamente</button>
          <button class="btn-link" (click)="irAMiPlan()">Ver mi plan actual</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resultado-wrapper { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .resultado-card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.1); padding:3rem 2.5rem; text-align:center; max-width:440px; width:100%; }
    .icono { font-size:4rem; margin-bottom:1rem; color:#ef4444; }
    h1 { font-family:'Poppins',sans-serif; font-size:1.5rem; font-weight:700; color:#1a1a2e; margin-bottom:0.75rem; }
    p { color:#64748b; margin-bottom:2rem; font-size:0.95rem; line-height:1.6; }
    .acciones { display:flex; flex-direction:column; gap:0.75rem; align-items:center; }
    .btn-primary { background:#2563eb; color:#fff; border:none; border-radius:8px; padding:0.75rem 2rem; font-size:1rem; font-weight:600; cursor:pointer; width:100%; }
    .btn-primary:hover { background:#1d4ed8; }
    .btn-link { background:transparent; border:none; color:#2563eb; font-size:0.9rem; cursor:pointer; text-decoration:underline; }
  `]
})
export class SuscripcionErrorComponent {
  private router = inject(Router);

  irAPlanes(): void {
    this.router.navigate(['/planes']);
  }

  irAMiPlan(): void {
    this.router.navigate(['/mi-plan']);
  }
}
