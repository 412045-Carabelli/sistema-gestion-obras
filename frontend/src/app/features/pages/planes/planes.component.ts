import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { PlanService } from '../../../services/plan/plan.service';
import { LayoutHeaderComponent } from '../../../shared/layout-header/layout-header.component';
import { environment } from '../../../../environments/environment';
import { PlanCodigo, PlanFeature } from '../../../core/models/models';

interface PlanUI {
  codigo: PlanCodigo;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number;
  badge?: string;
  highlight: boolean;
  limites: {
    usuarios: string;
    obras: string;
    clientes: string;
    proveedores: string;
    transacciones: string;
    storage: string;
    reportes: string;
  };
  features: { label: string; key: PlanFeature | null; incluido: boolean }[];
  ctaLabel: string;
}

@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css'],
  standalone: true,
  imports: [CommonModule, ToastModule, LayoutHeaderComponent],
  providers: [MessageService]
})
export class PlanesComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  planService = inject(PlanService);

  ciclo = signal<'mensual' | 'anual'>('mensual');
  featureRequerida = signal<string | null>(null);
  cargando = signal(true);
  planes = signal<PlanUI[]>([]);

  planActual = computed(() => this.planService.planCodigo());

  ngOnInit(): void {
    const feature = this.route.snapshot.queryParamMap.get('feature');
    if (feature) this.featureRequerida.set(feature);
    this.cargarPlanes();
  }

  private cargarPlanes(): void {
    this.http.get<any[]>(`${environment.apiGateway}/auth/planes`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      const activos = data
        .filter(p => p.activo && p.codigo !== 'FREE')
        .map(p => this.mapBackendPlan(p));
      this.planes.set(activos);
      this.cargando.set(false);
    });
  }

  private mapBackendPlan(data: any): PlanUI {
    const codigo = data.codigo as PlanCodigo;
    return {
      codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precioMensual: Number(data.precioMensualUsd),
      precioAnual: Number(data.precioAnualUsd),
      highlight: codigo === 'PROFESIONAL',
      badge: codigo === 'PROFESIONAL' ? 'Más popular' : undefined,
      limites: {
        usuarios:      data.maxUsuarios     ? `${data.maxUsuarios} usuario${data.maxUsuarios > 1 ? 's' : ''}` : 'Multiusuario',
        obras:         data.maxObrasActivas ? `${data.maxObrasActivas} obras activas`   : 'Ilimitadas',
        clientes:      data.maxClientes     ? `${data.maxClientes} clientes`            : 'Ilimitados',
        proveedores:   data.maxProveedores  ? `${data.maxProveedores} proveedores`      : 'Ilimitados',
        transacciones: data.maxTransaccionesMes ? `${data.maxTransaccionesMes} transacciones/mes` : 'Ilimitadas',
        storage:       data.maxStorageMb    ? this.formatStorage(data.maxStorageMb)     : 'Ilimitado',
        reportes:      data.diasHistorialReportes === 0 ? 'Sin reportería'
                      : data.diasHistorialReportes     ? `Últimos ${data.diasHistorialReportes} días`
                      : 'Reportería completa',
      },
      features: this.buildFeatures(data),
      ctaLabel: this.ctaLabel(codigo),
    };
  }

  private buildFeatures(data: any): PlanUI['features'] {
    return [
      { label: 'Gestión de obras y clientes',        key: null,                 incluido: true },
      { label: 'Proveedores y transacciones',         key: null,                 incluido: true },
      { label: 'Bot de WhatsApp',                     key: 'whatsapp_bot',       incluido: !!data.tieneWhatsappBot },
      { label: 'Reportería avanzada',                 key: 'exportar',           incluido: !!data.tieneExportar },
      { label: 'Diagrama de Gantt',                   key: 'gantt',              incluido: !!data.tieneGantt },
      { label: 'Facturación electrónica (próx.)',     key: 'facturas',           incluido: !!data.tieneFacturas },
      { label: 'Soporte prioritario',                 key: 'soporte_prioritario', incluido: !!data.tieneSoportePrioritario },
    ];
  }

  private formatStorage(mb: number): string {
    if (mb >= 1024) {
      const gb = mb / 1024;
      return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
    }
    return `${mb} MB`;
  }

  private ctaLabel(codigo: PlanCodigo): string {
    const labels: Partial<Record<PlanCodigo, string>> = {
      BASICO:       'Elegir Básico',
      PROFESIONAL:  'Elegir Profesional',
      ENTERPRISE:   'Contactar ventas',
    };
    return labels[codigo] ?? 'Elegir plan';
  }

  precio(plan: PlanUI): number {
    return this.ciclo() === 'anual' ? plan.precioAnual : plan.precioMensual * 12;
  }

  precioMensualEfectivo(plan: PlanUI): number {
    return this.ciclo() === 'anual'
      ? Math.round(plan.precioAnual / 12)
      : plan.precioMensual;
  }

  esPlanActual(codigo: PlanCodigo): boolean {
    return this.planActual() === codigo;
  }

  elegirPlan(plan: PlanUI): void {
    if (plan.codigo === 'ENTERPRISE') {
      this.messageService.add({
        severity: 'info',
        summary: 'Enterprise',
        detail: 'Contactanos para configurar tu plan Enterprise.'
      });
      return;
    }
    if (this.esPlanActual(plan.codigo)) return;

    this.router.navigate(['/checkout'], {
      queryParams: { plan: plan.codigo, ciclo: this.ciclo() }
    });
  }

  garantias = [
    { icon: 'pi-shield',     label: 'Sin permanencia' },
    { icon: 'pi-refresh',    label: 'Cambiá cuando quieras' },
    { icon: 'pi-lock',       label: 'Pago seguro' },
    { icon: 'pi-headphones', label: 'Soporte por WhatsApp' },
  ];
}
