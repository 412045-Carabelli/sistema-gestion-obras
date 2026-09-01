import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-configuracion-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, LayoutHeaderComponent],
  templateUrl: './configuracion-layout.component.html',
  styles: [`
    :host { display:block; height:100%; }
    .config-onboarding-shell {
      min-height:100%;
      display:flex;
      flex-direction:column;
      justify-content:center;
      background:#0a0a0a;
      background-image:
        radial-gradient(circle at 15% 0%, rgba(232,255,71,0.06), transparent 45%),
        radial-gradient(circle at 85% 20%, rgba(59,130,246,0.08), transparent 40%);
      padding: 40px 24px !important;
      box-sizing: border-box;
    }
  `]
})
export class ConfiguracionLayoutComponent implements OnDestroy {
  currentRoute = '';
  private sub = new Subscription();

  get enOnboarding(): boolean {
    return this.onboardingService.activo();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private onboardingService: OnboardingService
  ) {
    this.currentRoute = this.router.url;
    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => this.currentRoute = e.urlAfterRedirects)
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.rol === 'ADMIN';
  }

  get headerTitle(): string {
    return this.currentRoute.includes('/usuarios') ? 'Usuarios' : 'Configuración';
  }

  get headerSubtitle(): string {
    return this.currentRoute.includes('/usuarios')
      ? 'Gestión de usuarios de la empresa'
      : 'Ajustes de perfil y empresa';
  }
}
