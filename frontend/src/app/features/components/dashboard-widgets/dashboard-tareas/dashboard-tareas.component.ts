import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TareaAntiguaAgenda } from '../../../../core/models/models';
import { Subscription } from 'rxjs';

/**
 * Componente independiente para tareas pendientes antiguas del dashboard.
 * Sin filtros (siempre muestra las 10 más recientes).
 */
@Component({
  selector: 'app-dashboard-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-tareas.component.html',
  styleUrls: ['./dashboard-tareas.component.css']
})
export class DashboardTareasComponent implements OnInit, OnDestroy {

  loading = false;
  tareas: TareaAntiguaAgenda[] = [];
  private subs = new Subscription();
  private apiUrl = `${environment.apiGateway}/bff/agendas/antiguas`;

  constructor(private http: HttpClient, private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargar(): void {
    this.loading = true;
    this.subs.add(
      this.http.get<TareaAntiguaAgenda[]>(`${this.apiUrl}?limit=10`).subscribe({
        next: (response) => {
          this.tareas = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar tareas del dashboard', err);
          this.loading = false;
        }
      })
    );
  }
}
