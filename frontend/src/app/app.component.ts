import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet, NavigationEnd} from '@angular/router';
import {trigger, transition, style, animate} from '@angular/animations';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {OnboardingStepperComponent} from './shared/onboarding-stepper/onboarding-stepper.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';
import {ChangelogModalComponent} from './shared/changelog-modal/changelog-modal.component';
import {filter} from 'rxjs/operators';
import {interval} from 'rxjs';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {AuthService} from './services/auth/auth.service';
import {PlanService} from './services/plan/plan.service';
import {PushNotificationService} from './services/push/push-notification.service';
import {OnboardingService} from './core/services/onboarding.service';

const PUBLIC_ROUTES = ['/login', '/register'];
const EXACT_PUBLIC = ['/', '/home', '/terminos', '/privacidad'];
// /planes, /checkout y /suscripcion siempre muestran el stepper (en vez del
// navbar/sidebar normal), sea o no una alta nueva — es todo el circuito de elegir
// y pagar el plan, incluida la confirmación del pago.
const STEPPER_SIEMPRE = ['/planes', '/checkout', '/suscripcion'];
// Rutas que solo muestran el stepper mientras el alta guiada está en curso
// (register → elegir plan → configurar empresa). Fuera de una alta nueva,
// /configuracion se ve como la pantalla de ajustes normal, con navbar y sidebar.
const STEPPER_SOLO_ONBOARDING = ['/configuracion'];

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
    OnboardingStepperComponent,
    ChangelogModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    // Solo opacity — un transform aquí puede quedar "pegado" a mitad de
    // camino en algunas navegaciones rápidas, desplazando el layout con
    // fondo propio (ej. /planes, /checkout) y dejando asomar el bg de <main>.
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0 }),
        animate('220ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit{
  sidebarVisible: boolean = window.innerWidth >= 1024;
  isPublicRoute: boolean = isPublicPath();
  hideSidebar: boolean = false;
  showStepper: boolean = false;
  stepperPaso: 2 | 3 = 2;
  routeAnimCounter = 0;

  constructor(
    private navigationHistory: NavigationHistoryService,
    private router: Router,
    private authService: AuthService,
    private planService: PlanService,
    private pushService: PushNotificationService,
    private onboardingService: OnboardingService,
    private swUpdate: SwUpdate
  ) {
    (window as any).navHistoryDebug = this.navigationHistory;
    this.updateLayoutFlags(window.location.pathname);
  }

  private updateLayoutFlags(url: string): void {
    const siempre = STEPPER_SIEMPRE.some(r => url.startsWith(r));
    const esRutaOnboarding = siempre || STEPPER_SOLO_ONBOARDING.some(r => url.startsWith(r));
    // Apenas el usuario navega a cualquier pantalla normal del sistema (dashboard, obras,
    // etc.) se da por terminada el alta guiada — así el flag nunca queda pegado en una
    // pestaña donde el usuario abandonó el onboarding a mitad de camino sin terminarlo.
    if (!this.isPublicRoute && !esRutaOnboarding) {
      this.onboardingService.finalizar();
    }
    const soloOnboarding = STEPPER_SOLO_ONBOARDING.some(r => url.startsWith(r)) && this.onboardingService.activo();
    this.showStepper = siempre || soloOnboarding;
    this.hideSidebar = this.showStepper;
    // /suscripcion es la confirmación del pago: el paso "Elegir plan" ya está
    // resuelto en ese punto, lo siguiente es configurar la empresa.
    this.stepperPaso = (url.startsWith('/configuracion') || url.startsWith('/suscripcion')) ? 3 : 2;
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
      this.updateLayoutFlags(url);
      if (!this.isPublicRoute) {
        this.trySubscribePush();
      }
      if (this.isMobile) {
        this.sidebarVisible = false;
      }
    });
    const url = this.router.url;
    this.isPublicRoute = PUBLIC_ROUTES.some(r => url.startsWith(r)) || EXACT_PUBLIC.includes(url);
    this.updateLayoutFlags(url);
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
