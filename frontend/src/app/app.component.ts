import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';
import {ChangelogModalComponent} from './shared/changelog-modal/changelog-modal.component';

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

  constructor(private navigationHistory: NavigationHistoryService) {
    // DEBUG: Exponer el servicio en la consola
    (window as any).navHistoryDebug = this.navigationHistory;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  ngOnInit() {
    console.log("v1.2.4")
  }
}
