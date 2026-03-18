import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {ToastModule} from 'primeng/toast';
import {GlobalLoadingService} from './core/global-loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  sidebarVisible: boolean = true;
  globalLoadingState$;

  constructor(private globalLoadingService: GlobalLoadingService) {
    this.globalLoadingState$ = this.globalLoadingService.state$;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  ngOnInit() {
    console.log("v1.2.4")
  }
}
