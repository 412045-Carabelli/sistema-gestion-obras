import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet, NavigationEnd} from '@angular/router';
import {trigger, transition, style, animate} from '@angular/animations';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';
import {ChangelogModalComponent} from './shared/changelog-modal/changelog-modal.component';
import {filter} from 'rxjs/operators';
import {interval} from 'rxjs';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {AuthService} from './services/auth/auth.service';
import {PlanService} from './services/plan/plan.service';
import {PushNotificationService} from './services/push/push-notification.service';

const PUBLIC_ROUTES = ['/login', '/register'];
const EXACT_PUBLIC = ['/', '/home', '/terminos', '/privacidad'];

function isPublicPath(): boolean {
  const path = window.location.pathname;
  return PUBLIC_ROUTES.some(r => path.startsWith(r)) || EXACT_PUBLIC.includes(path);
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ChangelogModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit{
  sidebarVisible: boolean = window.innerWidth >= 1024;
  isPublicRoute: boolean = isPublicPath();
  routeAnimCounter = 0;

  constructor(
    private navigationHistory: NavigationHistoryService,
    private router: Router,
    private authService: AuthService,
    private planService: PlanService,
    private pushService: PushNotificationService,
    private swUpdate: SwUpdate
  ) {
    (window as any).navHistoryDebug = this.navigationHistory;
  }

  get isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  ngOnInit() {
    console.log("v1.2.4");
    this.setupServiceWorkerUpdates();
    // Inicializar plan desde token existente (reload de página)
    // Se hace aquí y no en AuthService para evitar circular dep en DI
    const token = this.authService.getAccessToken();
    if (token) this.planService.initFromToken(token);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
      this.routeAnimCounter++;
      this.isPublicRoute = PUBLIC_ROUTES.some(r => url.startsWith(r)) || EXACT_PUBLIC.includes(url);
      if (!this.isPublicRoute) {
        this.trySubscribePush();
      }
      if (this.isMobile) {
        this.sidebarVisible = false;
      }
    });
    const url = this.router.url;
    this.isPublicRoute = PUBLIC_ROUTES.some(r => url.startsWith(r)) || EXACT_PUBLIC.includes(url);
    if (!this.isPublicRoute) {
      this.trySubscribePush();
    }
  }

  private setupServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    // Nueva version del bundle detectada (subida a prod) -> activar y refrescar sola.
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => window.location.reload());
      });

    // El SW solo chequea update en la carga inicial; en una SPA de sesion larga
    // hay que pedirlo explicitamente para no quedar pegado a un bundle viejo.
    interval(15 * 60 * 1000).subscribe(() => {
      this.swUpdate.checkForUpdate().catch(() => {});
    });
  }

  private trySubscribePush(): void {
    const user = this.authService.getCurrentUser();
    if (user?.rol !== 'ADMIN') return;
    // SW se registra async — esperamos hasta 10s
    const attempt = (retries: number) => {
      if (this.pushService.isSupported) {
        this.pushService.requestSubscription();
      } else if (retries > 0) {
        setTimeout(() => attempt(retries - 1), 1000);
      }
    };
    attempt(10);
  }
}
