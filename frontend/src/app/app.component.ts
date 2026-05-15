import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {NavigationHistoryService} from './core/services/navigation-history.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
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
