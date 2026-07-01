import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PlanService } from '../../../services/plan/plan.service';
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
  imports: [CommonModule, ToastModule],
  providers: [MessageService]
})
export class PlanesComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  planService = inject(PlanService);

  ciclo = signal<'mensual' | 'anual'>('mensual');
  featureRequerida = signal<string | null>(null);

  planActual = computed(() => this.planService.planCodigo());

  planes: PlanUI[] = [
    {
      codigo: 'FREE',
      nombre: 'Free',
      descripcion: 'Para explorar la plataforma y proyectos pequeños.',
      precioMensual: 0,
      precioAnual: 0,
      highlight: false,
      limites: {
        usuarios: '1 usuario',
        obras: '3 obras activas',
        clientes: '10 clientes',
        proveedores: '10 proveedores',
        transacciones: '10 transacciones/mes',
        storage: '50 MB',
        reportes: 'Sin reportes',
      },
      features: [
        { label: 'Obras y clientes básicos', key: null, incluido: true },
        { label: 'Facturas', key: 'facturas', incluido: false },
        { label: 'Agenda y tareas', key: 'agenda', incluido: false },
        { label: 'Grupos de obras', key: 'grupos_obras', incluido: false },
        { label: 'Exportar PDF/Excel', key: 'exportar', incluido: false },
        { label: 'Notificaciones push', key: 'push_notifications', incluido: false },
      ],
      ctaLabel: 'Plan actual',
    },
    {
      codigo: 'BASICO',
      nombre: 'Básico',
      descripcion: 'Para empresas chicas que arrancan a gestionar obras.',
      precioMensual: 149,
      precioAnual: 1490,
      highlight: false,
      limites: {
        usuarios: '3 usuarios',
        obras: '20 obras activas',
        clientes: '100 clientes',
        proveedores: '50 proveedores',
        transacciones: '150 transacciones/mes',
        storage: '1 GB',
        reportes: 'Últimos 30 días',
      },
      features: [
        { label: 'Todo lo de Free', key: null, incluido: true },
        { label: 'Facturas', key: 'facturas', incluido: true },
        { label: 'Agenda y tareas', key: 'agenda', incluido: true },
        { label: 'Grupos de obras', key: 'grupos_obras', incluido: false },
        { label: 'Exportar PDF/Excel', key: 'exportar', incluido: false },
        { label: 'Notificaciones push', key: 'push_notifications', incluido: false },
      ],
      ctaLabel: 'Elegir Básico',
    },
    {
      codigo: 'PROFESIONAL',
      nombre: 'Profesional',
      descripcion: 'Para equipos en crecimiento con gestión completa.',
      precioMensual: 399,
      precioAnual: 3990,
      badge: 'Más popular',
      highlight: true,
      limites: {
        usuarios: '10 usuarios',
        obras: '100 obras activas',
        clientes: 'Ilimitados',
        proveedores: 'Ilimitados',
        transacciones: 'Ilimitadas',
        storage: '10 GB',
        reportes: 'Historial completo',
      },
      features: [
        { label: 'Todo lo de Básico', key: null, incluido: true },
        { label: 'Grupos de obras', key: 'grupos_obras', incluido: true },
        { label: 'Exportar PDF/Excel', key: 'exportar', incluido: true },
        { label: 'Notificaciones push', key: 'push_notifications', incluido: true },
        { label: 'Soporte prioritario', key: 'soporte_prioritario', incluido: true },
        { label: 'API Access', key: 'api_access', incluido: false },
      ],
      ctaLabel: 'Elegir Profesional',
    },
    {
      codigo: 'ENTERPRISE',
      nombre: 'Enterprise',
      descripcion: 'Sin límites. Para constructoras grandes y multi-proyecto.',
      precioMensual: 899,
      precioAnual: 8990,
      highlight: false,
      limites: {
        usuarios: 'Ilimitados',
        obras: 'Ilimitadas',
        clientes: 'Ilimitados',
        proveedores: 'Ilimitados',
        transacciones: 'Ilimitadas',
        storage: '100 GB',
        reportes: 'Historial completo',
      },
      features: [
        { label: 'Todo lo de Profesional', key: null, incluido: true },
        { label: 'API Access', key: 'api_access', incluido: true },
        { label: 'Soporte dedicado', key: 'soporte_prioritario', incluido: true },
        { label: 'Onboarding personalizado', key: null, incluido: true },
        { label: 'SLA garantizado', key: null, incluido: true },
        { label: 'Facturación personalizada', key: null, incluido: true },
      ],
      ctaLabel: 'Contactar ventas',
    },
  ];

  ngOnInit(): void {
    const feature = this.route.snapshot.queryParamMap.get('feature');
    if (feature) {
      this.featureRequerida.set(feature);
    }
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
      // Por ahora redirige a contacto — Fase 5 conecta MP
      this.messageService.add({
        severity: 'info',
        summary: 'Enterprise',
        detail: 'Contactanos para configurar tu plan Enterprise.'
      });
      return;
    }
    if (this.esPlanActual(plan.codigo)) return;

    // Fase 5: navegar al checkout con Mercado Pago
    this.router.navigate(['/checkout'], {
      queryParams: { plan: plan.codigo, ciclo: this.ciclo() }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}
