import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-onboarding-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-stepper.component.html',
  styleUrls: ['./onboarding-stepper.component.css']
})
export class OnboardingStepperComponent {
  /** Paso actual del onboarding: 2 = elegir plan, 3 = configurar empresa */
  @Input() step: 2 | 3 = 2;

  constructor(private authService: AuthService, private router: Router) {}

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
