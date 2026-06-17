import { Component, EventEmitter, OnInit, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ConfiguracionService, CONFIG_KEYS } from '../../services/configuracion/configuracion.service';
import { AuthService } from '../../services/auth/auth.service';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    MenuModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleMenu = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: Menu;

  logoUrl: string | null = null;
  menuItems: MenuItem[] = [];

  private sub = new Subscription();

  constructor(
    private configuracionService: ConfiguracionService,
    private authService: AuthService,
    private router: Router
  ) {}

  get userInitials(): string {
    const username = this.authService.getCurrentUser()?.username ?? '';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase() || 'U';
  }

  get userAvatarUrl(): string | null {
    return null; // extensible: leer de perfil cuando exista
  }

  ngOnInit(): void {
    this.menuItems = [
      {
        label: this.authService.getCurrentUser()?.username ?? 'Usuario',
        items: [
          {
            label: 'Mi plan',
            icon: 'pi pi-star',
            command: () => {}
          },
          {
            label: 'Configuración',
            icon: 'pi pi-cog',
            command: () => this.router.navigate(['/configuracion'])
          },
          {
            separator: true
          },
          {
            label: 'Cerrar sesión',
            icon: 'pi pi-sign-out',
            styleClass: 'text-red-500',
            command: () => this.logout()
          }
        ]
      }
    ];

    this.sub.add(
      this.configuracionService.config$.subscribe(config => {
        this.logoUrl = config[CONFIG_KEYS.LOGO_URL] || null;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  onLogoError(): void {
    this.logoUrl = null;
  }

  toggleUserMenu(event: Event): void {
    this.userMenu.toggle(event);
  }

  private logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
