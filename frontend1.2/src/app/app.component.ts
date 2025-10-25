import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ServerSleepComponent } from './features/components/server-sleep/server-sleep.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
export class AppComponent implements OnInit {
  sidebarVisible: boolean = true;
  showServerSleep = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.wakeUpMicroservices();
    console.log(environment);
  }

  private wakeUpMicroservices() {
    const urls = [
      `${environment.apiGateway}/bff/obras`,
      `${environment.apiGateway}/bff/documentos/obra/1`,
      `${environment.apiGateway}/bff/transacciones`,
      `${environment.apiGateway}/bff/clientes`,
      `${environment.apiGateway}/bff/proveedores`,
    ];

    console.log('⏳ Verificando estado de los microservicios individualmente...');

    const backoffs = [1000, 3000, 5000, 8000, 12000];

    const tryPing = (i: number) => {
      const calls = urls.map(url =>
        this.http.get(url).pipe(
          catchError(err => {
            console.warn(`❌ Error al intentar ${url}:`, err);
            return of(null);
          })
        )
      );

      forkJoin(calls).subscribe(results => {
        const allUp = results.every(r => r !== null);
        if (allUp) {
          console.log('✅ Todos los microservicios están arriba');
          this.showServerSleep = false;
        } else if (i < backoffs.length - 1) {
          console.warn(`⚠️ Algunos microservicios siguen dormidos. Reintento ${i + 1}`);
          setTimeout(() => tryPing(i + 1), backoffs[i]);
        } else {
          console.error('💤 No se pudo levantar al menos un microservicio.');
          this.showServerSleep = true;
        }
      });
    };

    tryPing(0);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
