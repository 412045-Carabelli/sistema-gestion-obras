import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './shared/header/header.component';
import {SidebarComponent} from './shared/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';
import {environment} from '../enviroments/enviroment';
import {ServerSleepComponent} from './features/components/server-sleep/server-sleep.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ServerSleepComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  sidebarVisible: boolean = true;

  showServerSleep = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.wakeUpMicroservices();
  }

  private wakeUpMicroservices() {
    const healthUrl = `${environment.apiGateway}/bff/health`;

    console.log('⏳ Verificando estado de los microservicios...');

    const backoffs = [1000, 3000, 5000, 8000, 12000];

    const tryPing = (i: number) => {
      this.http.get(healthUrl).subscribe({
        next: (res) => {
          console.log('✅ Microservicios activos:', res);
          this.showServerSleep = false;
        },
        error: (err) => {
          console.warn(`⚠️ Intento ${i + 1} fallido. Reintentando...`, err);
          if (i < backoffs.length - 1) {
            setTimeout(() => tryPing(i + 1), backoffs[i]);
          } else {
            console.error('💤 Algunos microservicios siguen dormidos.');
            this.showServerSleep = true;
          }
        }
      });
    };

    tryPing(0);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
