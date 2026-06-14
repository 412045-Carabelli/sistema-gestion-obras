import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';

@Component({
  selector: 'app-configuracion-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, LayoutHeaderComponent],
  templateUrl: './configuracion-layout.component.html'
})
export class ConfiguracionLayoutComponent implements OnDestroy {
  currentRoute = '';
  private sub = new Subscription();

  constructor(private authService: AuthService, private router: Router) {
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
