import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of, Subscription } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlanService } from '../../../services/plan/plan.service';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';
import { environment } from '../../../../environments/environment';
import { PlanConfig } from '../../../core/models/models';

interface RecursoUso {
  label: string;
  icono: string;
  actual: number | null;
  limite: number | null;
  sufijo?: string;
}

@Component({
  selector: 'app-mi-plan',
  templateUrl: './mi-plan.component.html',
  styleUrls: ['./mi-plan.component.css'],
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, LayoutHeaderComponent],
  providers: [ConfirmationService, MessageService]
})
export class MiPlanComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private http = inject(HttpClient);
  private planService = inject(PlanService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private subs = new Subscription();

  readonly planConfig = this.planService.planConfig;

  cargando = signal(true);
  cancelando = signal(false);
  planDetalle = signal<any>(null);

  recursos = signal<RecursoUso[]>([]);

  readonly estadoBadgeClass = computed(() => {
    const estado = this.planDetalle()?.suscripcionEstado ?? 'FREE';
    return {
      'badge-activa':  estado === 'ACTIVA',
      'badge-trial':   estado === 'TRIAL',
      'badge-vencida': estado === 'VENCIDA',
      'badge-cancelada': estado === 'CANCELADA',
      'badge-free':    estado === 'FREE'
    };
  });

  readonly planBadgeClass = computed(() => {
    const codigo = this.planConfig()?.planCodigo ?? 'FREE';
    return `plan-badge plan-${codigo.toLowerCase()}`;
  });

  readonly features = computed(() => {
    const c = this.planConfig();
    if (!c) return [];
    return [
      { label: 'Facturas electrónicas', key: 'facturas',              habilitada: c.features.facturas },
      { label: 'Agenda de tareas',      key: 'agenda',                habilitada: c.features.agenda },
      { label: 'Grupos de obras',       key: 'grupos_obras',          habilitada: c.features.grupos_obras },
      { label: 'Exportar reportes',     key: 'exportar',              habilitada: c.features.exportar },
      { label: 'Notificaciones push',   key: 'push_notifications',    habilitada: c.features.push_notifications },
      { label: 'Soporte prioritario',   key: 'soporte_prioritario',   habilitada: c.features.soporte_prioritario },
      { label: 'Acceso a API',          key: 'api_access',            habilitada: c.features.api_access },
    ];
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    const api = environment.apiGateway;
    this.subs.add(
      forkJoin({
        miPlan:      this.http.get<any>(`${api}/auth/mi-plan`).pipe(catchError(() => of(null))),
        obras:       this.http.get<any[]>(`${api}/bff/obras`).pipe(catchError(() => of([]))),
        clientes:    this.http.get<any[]>(`${api}/bff/clientes`).pipe(catchError(() => of([]))),
        proveedores: this.http.get<any[]>(`${api}/bff/proveedores/simple`).pipe(catchError(() => of([]))),
      }).subscribe(({ miPlan, obras, clientes, proveedores }) => {
        if (miPlan) {
          this.planDetalle.set(miPlan);
          // Actualiza el planService con datos frescos del backend
          this.planService.fetchMiPlan();
        }

        const limites = this.planConfig()?.limites;

        this.recursos.set([
          {
            label:  'Obras activas',
            icono:  'pi-building',
            actual: Array.isArray(obras) ? obras.length : null,
            limite: limites?.maxObrasActivas ?? null,
          },
          {
            label:  'Clientes',
            icono:  'pi-users',
            actual: Array.isArray(clientes) ? clientes.length : null,
            limite: limites?.maxClientes ?? null,
          },
          {
            label:  'Proveedores',
            icono:  'pi-truck',
            actual: Array.isArray(proveedores) ? proveedores.length : null,
            limite: limites?.maxProveedores ?? null,
          },
          {
            label:  'Transacciones este mes',
            icono:  'pi-credit-card',
            actual: null,   // requiere endpoint dedicado
            limite: limites?.maxTransaccionesMes ?? null,
            sufijo: '/mes',
          },
          {
            label:  'Historial de reportes',
            icono:  'pi-chart-bar',
            actual: null,
            limite: limites?.diasHistorialReportes ?? null,
            sufijo: ' días',
          },
        ]);

        this.cargando.set(false);
      })
    );
  }

  porcentaje(recurso: RecursoUso): number {
    if (recurso.actual === null || recurso.limite === null || recurso.limite === 0) return 0;
    return Math.min(100, Math.round((recurso.actual / recurso.limite) * 100));
  }

  colorBarra(pct: number): string {
    if (pct >= 90) return 'barra-roja';
    if (pct >= 70) return 'barra-naranja';
    return 'barra-verde';
  }

  irAPlanes(): void {
    this.router.navigate(['/planes']);
  }

  confirmarCancelar(): void {
    this.confirmationService.confirm({
      header: 'Cancelar suscripción',
      message: '¿Estás seguro? Tu cuenta pasará al plan FREE al vencer el período actual. No se realizarán más cobros.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No, mantener',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelarSuscripcion(),
    });
  }

  private cancelarSuscripcion(): void {
    this.cancelando.set(true);
    this.subs.add(
      this.http.patch(`${environment.apiGateway}/auth/mi-suscripcion/cancelar`, {}).pipe(
        catchError(err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cancelar la suscripción. Intentá más tarde.'
          });
          this.cancelando.set(false);
          return of(null);
        })
      ).subscribe(res => {
        if (res !== null) {
          this.messageService.add({
            severity: 'success',
            summary: 'Suscripción cancelada',
            detail: 'Tu cuenta continuará activa hasta el vencimiento del período.'
          });
          this.cargarDatos();
        }
        this.cancelando.set(false);
      })
    );
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      ACTIVA: 'Activa', TRIAL: 'Trial', VENCIDA: 'Vencida',
      CANCELADA: 'Cancelada', FREE: 'Plan Free'
    };
    return map[estado] ?? estado;
  }

  cicloLabel(ciclo: string): string {
    return ciclo === 'ANUAL' ? 'Anual' : 'Mensual';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
