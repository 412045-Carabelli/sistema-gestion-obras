import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../services/auth/auth.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { RegisterRequest } from '../../../core/models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private onboardingService = inject(OnboardingService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  form!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      empresaNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const request: RegisterRequest = this.form.getRawValue();

    this.authService.register(request).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta creada',
          detail: 'Ahora elegí tu plan'
        });

        // A partir de acá arranca el flujo guiado: elegir plan → configurar empresa
        this.onboardingService.iniciar();

        // Si venía de la landing queriendo contratar un plan puntual, saltar directo al pago
        const pendingCheckout = sessionStorage.getItem('pending_checkout');
        if (pendingCheckout) {
          sessionStorage.removeItem('pending_checkout');
          const { plan, ciclo } = JSON.parse(pendingCheckout);
          setTimeout(() => this.router.navigate(['/checkout'], { queryParams: { plan, ciclo } }), 800);
          return;
        }

        setTimeout(() => this.router.navigate(['/planes']), 800);
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Error al registrarse';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  volverAlInicio(): void {
    this.router.navigate(['/home']);
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword && password === confirmPassword) {
      group.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }
}
