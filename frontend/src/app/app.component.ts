import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet, NavigationEnd} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';
import {ChangelogModalComponent} from './shared/changelog-modal/changelog-modal.component';
import {filter} from 'rxjs/operators';
import {AuthService} from './services/auth/auth.service';
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
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  sidebarVisible: boolean = window.innerWidth >= 1024;
  isPublicRoute: boolean = isPublicPath();

  constructor(
    private navigationHistory: NavigationHistoryService,
    private router: Router,
    private authService: AuthService,
    private pushService: PushNotificationService
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
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
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
