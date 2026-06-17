import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterOutlet, NavigationEnd} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';
import {ChangelogModalComponent} from './shared/changelog-modal/changelog-modal.component';
import {filter} from 'rxjs/operators';

const PUBLIC_ROUTES = ['/login', '/register'];

function isPublicPath(): boolean {
  return PUBLIC_ROUTES.some(r => window.location.pathname.startsWith(r));
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
  sidebarVisible: boolean = true;
  isPublicRoute: boolean = isPublicPath();

  constructor(
    private navigationHistory: NavigationHistoryService,
    private router: Router
  ) {
    (window as any).navHistoryDebug = this.navigationHistory;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  ngOnInit() {
    console.log("v1.2.4");
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.isPublicRoute = PUBLIC_ROUTES.some(r => e.urlAfterRedirects.startsWith(r));
    });
    // check on init for direct navigation
    this.isPublicRoute = PUBLIC_ROUTES.some(r => this.router.url.startsWith(r));
  }
}
